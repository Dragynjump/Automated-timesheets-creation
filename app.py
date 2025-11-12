import datetime as dt
from datetime import timedelta 
import os
import openpyxl as op 
import sys
from flask import Flask, render_template, request, jsonify
import webview
import tkinter as tk
from tkinter import filedialog

"""
CURRENT BUGS
Hours worked calculated in JavaScript throws a NaN value if the value in the clock in slot is anything other than a valid timestamp
Needs to change to an empty value
Indexing into the worksheets has been updated to use less code. It's a little more hardcoded now, so I'll need to keep an eye out
for if the worksheets are updated or altered in any way. It could break the code.
Repeatedly clocking out stacks branch names on top of each other repeatedly
Need to connect to GitHub and create auto-installer
"""
# Help PyInstaller determine the base directory for resources
base_dir = '.'
if hasattr(sys, '_MEIPASS'):
    base_dir = os.path.join(sys._MEIPASS)

app = Flask(__name__, static_folder=os.path.join(base_dir, 'static'), template_folder=os.path.join(base_dir, 'templates'))

# Collect screen dimension info
root = tk.Tk()
screen_width = root.winfo_screenwidth()
screen_height = root.winfo_screenheight()
root.destroy()

# Create teacher's name list
teacherNames = []
teacherNameCount = 0

# Get current time and dates, store as variables
currentTime = dt.datetime.now()
currentMonthYear = currentTime.strftime("%B") + " " + currentTime.strftime("%Y")
monthArray = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
# Set folder path for completed spreadsheets
yearRange = ""
if currentTime.month < 4:
    if currentTime.month == 3 and currentTime.day > 26:
        yearRange = str(currentTime.year) + "-" + str(currentTime.year + 1)
    else:
        yearRange = str(currentTime.year - 1) + "-" + str(currentTime.year)
else:
    yearRange = str(currentTime.year) + "-" + str(currentTime.year + 1)
namingConvention = " - Work Hours - " + yearRange
namingConventionAdjusted = namingConvention + " (Punch Clock)" + ".xlsx"
folder_path = "G:/My Drive/For Branch Managers/HANDZ Punch Clock/Work Hours & Transport Sheets " + yearRange
currentBranch = "SK"

# APP DECLARATION
app = Flask(__name__,template_folder="templates")

# MAIN FUNCTIONS
def findTeacherNames():
    try:
        teacherNames.clear()
    except UnboundLocalError:
        print("TeacherNames array empty")
    global teacherNameCount 
    teacherNameCount = 0
    try:
        for item in os.listdir(folder_path):
            item_path = os.path.join(folder_path, item)
            if os.path.isfile(item_path):
                fileName = f"{item}"
                #Only read necessary files
                if fileName[len(fileName) - len(namingConventionAdjusted): len(fileName)] == namingConventionAdjusted:
                    teacherName = fileName[0:len(fileName) - (len(namingConventionAdjusted))]
                    teacherNames.append(teacherName)
                    teacherNameCount = teacherNameCount + 1
    except FileNotFoundError:
        print("No directory")
def findUserTimesheet(userName):
    #After username is retrieved, copy teacher's excel file into openpyxl workbook, then store current sheet into a dataframe
    try:
        wb = op.load_workbook(f'{folder_path}/{userName}{namingConventionAdjusted}', data_only = True)
    except FileNotFoundError:
        return False
    return wb
def insertPunchTime(workSheet, clIn, clOut, hrs, brnch, notes):
    # Define variables for cell search (time, rows, columns, etc.)
    maxRow = workSheet.max_row
    maxColumn = workSheet.max_column
    formattedDate = currentTime.strftime("%d") + "-" + currentTime.strftime("%m") + "-" + currentTime.strftime("%Y")
    stringFormat = "%d-%m-%Y"
    stringDatetimeObj = dt.datetime.strptime(formattedDate, stringFormat)

    # Search for current date and fill in current time for punch clock
    attempts = 0
    for i in range (1, maxRow + 1):
        if workSheet.cell(row = i, column = 1).value == stringDatetimeObj:
            # Insert clock in time
            workSheet.cell(row = i, column = 3).value = clIn
            # Insert clock out time
            workSheet.cell(row = i, column = 5).value = clOut
            # Insert hrs worked
            workSheet.cell(row = i, column = 6).value = hrs
            # Insert branch location
            workSheet.cell(row = i, column = 9).value = brnch
            # Insert notes
            workSheet.cell(row = i, column = 11).value = notes
            break
        else:
            attempts = attempts + 1
        if attempts == maxRow + 1:
            return False

    # Initialize variables
    totalWorkHours = 0
    totalPlusHours = 0
    totalMinusHours = 0
    totalDaysWorked = 0
    # Add totals for all necessary cells and read to correct slots when finished
    for x in range (6, maxRow + 1):
            if workSheet.cell(row = x, column = 1).value == "Total":
                workSheet.cell(row = x, column = 6).value = totalWorkHours
                workSheet.cell(row = x, column = 7).value = totalPlusHours
                workSheet.cell(row = x, column = 8).value = totalMinusHours
                workSheet.cell(row = x, column = 9).value = totalDaysWorked
                break
            if workSheet.cell(row = x, column = 6).value is not None:
                try:
                    totalWorkHours = totalWorkHours + int(workSheet.cell(row = x, column = 6).value)
                except ValueError:
                    print("Not a valid integer: " + str(workSheet.cell(row = x, column = 6).value))
            if workSheet.cell(row = x, column = 7).value is not None:
                try:
                    totalPlusHours = totalPlusHours + int(workSheet.cell(row = x, column = 7).value)
                except ValueError:
                    print("Not a valid integer: " + str(workSheet.cell(row = x, column = 6).value))
            if workSheet.cell(row = x, column = 8).value is not None:
                try:
                    totalMinusHours = totalMinusHours + int(workSheet.cell(row = x, column = 8).value)
                except ValueError:
                    print("Not a valid integer: " + str(workSheet.cell(row = x, column = 6).value))
            if workSheet.cell(row = x, column = 9).value is not None:
                totalDaysWorked = totalDaysWorked + 1
    return True

def checkTotalWorkTime(clockInTime):
    clockInHour = ""
    # Turn clock in time into useable integer, or just the hour if time object
    if type(clockInTime).__name__ == "str":
        for char in clockInTime:
            if char == ":":
                break
            else:
                clockInHour = clockInHour + char
        clockInHour = int(clockInHour)
    else:
        clockInHour = clockInTime.hour

    # Calculate total hours worked minus 1 for days with a lunch hour
    totalHoursWorked = currentTime.hour - clockInHour
    if clockInHour < 12 and currentTime.hour > 12:
        totalHoursWorked = totalHoursWorked - 1
    return totalHoursWorked
def checkRecentData(workSheet):
    # Define variables for cell search (time, rows, columns, etc.)
    maxRow = workSheet.max_row
    maxColumn = workSheet.max_column
    formattedDate = currentTime.strftime("%d") + "-" + currentTime.strftime("%m") + "-" + currentTime.strftime("%Y")
    stringFormat = "%d-%m-%Y"
    stringDatetimeObj = dt.datetime.strptime(formattedDate, stringFormat)

    # Search for current date and fill in current time for punch clock
    for i in range (1, maxRow + 1):
        for j in range (1, maxColumn + 1):
            if workSheet.cell(row = i, column = j).value == stringDatetimeObj:
                recentDataObject = {
                    # Retrieve clock in time
                    "clockin": str(workSheet.cell(row = i, column = j + 1).value),
                    # Retrieve clock in time
                    "clockout": str(workSheet.cell(row = i, column = j + 3).value),
                    # Retrieve branch location
                    "hours": str(workSheet.cell(row = i, column = j + 4).value),
                    # Retrieve branch location
                    "branch": str(workSheet.cell(row = i, column = j + 7).value),
                    # Retrieve branch location
                    "notes": str(workSheet.cell(row = i, column = j + 9).value)
                }
                for item in recentDataObject:
                    if recentDataObject[item] == "None":
                        recentDataObject[item] = ""
    return recentDataObject
def getWorksheet(workBook):
    # Change the sheet depending on whether we're past payday
    sheetToUse = ""
    if currentTime.day > 25:
        if currentTime.month == 12:
             sheetToUse = monthArray[0] + " " + currentTime.strftime("%Y")
        else:
            sheetToUse = monthArray[currentTime.month] + " " + currentTime.strftime("%Y")
    else:
        sheetToUse = currentMonthYear
    return workBook[sheetToUse]
# WEBVIEW FUNCTIONS
def create():
    myWindowWidth = screen_width - 100
    myWindowHeight = screen_height - 100
    xLocation = (screen_width / 2) - (myWindowWidth / 2)
    yLocation = (screen_height / 2) - (myWindowHeight / 2)
    return webview.create_window('Handz Punch Clock', app, width=myWindowWidth, height=myWindowHeight, x=xLocation, y=yLocation)
def minimize():
    window.minimize()
def maximize():
    window.toggle_fullscreen()
def close():
    window.destroy()

# Directory functions (tkinter)
def openFolderDialog():
    # Hide the main Tkinter window
    root = tk.Tk()
    root.withdraw()

    # Open the folder selection dialog
    userFolderPath = filedialog.askdirectory(
        title="Select a folder",
        initialdir=folder_path  # You can set an initial directory
    )

    if userFolderPath:
        root.destroy()
        return userFolderPath
    else:
        root.destroy()
        userFolderPath = folder_path
        return userFolderPath

@app.route("/")
def startup():
    findTeacherNames()
    return render_template('index.html', teacherNames=teacherNames, folder_path=folder_path, teacherNameCount=teacherNameCount, currentBranch=currentBranch)
    
@app.route('/update', methods=['POST'])
def update():
    # Get data from javascript page
    data = request.get_json()
    scannedName = data.get('owner')
    clockInTime = data.get('var1')
    clockOutTime = data.get('var2')
    hoursWorked = data.get('var3')
    branch = data.get('var4')
    notes = data.get('var5')
    # Find user workbook and save data to it
    userWorkbook = findUserTimesheet(scannedName)
    if userWorkbook is not False:
        if insertPunchTime(getWorksheet(userWorkbook), clockInTime, clockOutTime, hoursWorked, branch, notes):
            try:
                userWorkbook.save(f"{folder_path}/{scannedName}{namingConventionAdjusted}")
                return "success"
            except PermissionError:
                return "fail"
            except Exception as e:
                return f"{e}"
    else:
        return "FileNotFoundError"
    
        
@app.route("/changeDirectory", methods=['POST'])
def changeDirectory():
    global folder_path 
    folder_path = openFolderDialog()
    findTeacherNames()
    mainPageData = {
        "fp": folder_path,
        "tn": teacherNames,
        "tnc": teacherNameCount
    }
    return jsonify(mainPageData)

@app.route("/collectFileData", methods=['POST'])
def collectFileData():
    userWorkbook = findUserTimesheet("Dakota")
    userWorksheet = getWorksheet(userWorkbook)
    recentData = checkRecentData(userWorksheet)
    return jsonify(recentData)

if __name__ == '__main__':
    #app.run(debug=True)
    window = create()
    webview.start()