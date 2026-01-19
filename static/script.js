const ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const encryptionKey = "BNRC1MD8FQ2WG7HS3VJ6KP4L5T";

// Added to the stack separately from regular code
const intervalID = setInterval(updateClock, 1000);
// clearInterval(intervalID);

// Allow canvas to be read less to improve optimization
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

// Define the configurations for Quagga
const quaggaConf = {
    inputStream: {
        //target: document.querySelector("#camera")
        target: canvas,
        type: "LiveStream",
        constraints: {
            width: { min: 640 },
            height: { min: 480 },
            facingMode: "environment",
            aspectRatio: { min: 1, max: 2 }
        }
    },
    decoder: {
        readers: ['code_128_reader']
    },
}

// Access teacher names list stored in HTML and convert to Javascript data for parsing
var teacherNamesDataPassString = document.getElementById("teacherNamesDataPass").dataset.value;
var teacherNamesArray = parseNamesList(teacherNamesDataPassString);
let teacherName = "";

// Variables for filling in recent timesheet data and presenting them to the user
var recentClockIn = "";
var recentClockOut = "";
var recentHours = "";
var recentBranch = "";
var recentNotes = "";

adjustTeacherCountCircle(document.getElementById("nameCheckInterior").innerHTML);
setEventsOnClicked("editButton", changeDirectory);

loadMainPage();

// FUNCTIONS
// Quagga
function initializeQuagga()
{
    // Initialize Quagga and start it if no errors
    Quagga.init(quaggaConf, function (err) {
        if (err) {
            return console.log(err);
        }
        Quagga.start();
    });
}
function QuaggaDetectBarcodes()
{
    Quagga.onDetected(function (result) {
        let scannedName = result.codeResult.code;
        //console.log("Scan result: " + scannedName);
        teacherName = decrypt(scannedName);
        //console.log("Decrypted result: " + teacherName);
        if (nameIsInArray(teacherName, teacherNamesArray) == true) 
        {
            Quagga.stop();
            loadSecondaryPage();
        }
    });
}

// Load pages
function loadMainPage()
{
    // Add main page HTML
    document.getElementById("changeableContentSpace").innerHTML = `
            <!-- Main page START -->
            <div id="mainPage">
                <div id="leftSide">
                    <canvas id="myCanvas" class="imgBuffer">
                        <div id="camera" alt="Camera feed"></div>
                    </canvas>
                    <div id="errorLog"></div>
                </div>
                <div id="rightSide">
                    <div class="rightSideDiv">
                        <div id="message">Place your ID near the camera to scan</div>
                    </div>
                    <div class="rightSideDiv">
                        <img src="static/images/ID card example male (no text).png" height="200px" alt="ID card example"></img>
                    </div>
                    <div class="rightSideDiv">
                        <button class="smallButton blueButton", id="missingIDButton">Forgot your ID?</button>
                    </div>
                </div>
            </div>
            <!-- Main page FINISH -->
        `;
    setEventsOnClicked("missingIDButton", loadThirdPage);
    initializeQuagga();
    QuaggaDetectBarcodes();
}
function loadOldSecondaryPage()
{
    // Load in clock in or out page
    document.getElementById("changeableContentSpace").innerHTML = `    
    <div id="secondaryPage">
        <div id="secondaryTextDiv">
            <div class="secondaryText", id="employeeName"></div>
            <div class="secondaryText">
                Do you want to clock in or out?
            </div>
        </div>
        <div class="secondaryButtonsDiv">
            <button class="bigButton blueButton", id="clockIn">Clock in</button>
            <button class="bigButton blueButton", id="clockOut">Clock out</button>
        </div>
        <div class="secondaryButtonsDiv", id="secondaryBackButtonDiv">
            <button class="smallButton greyButton", id="backButton"><img src="static/images/Arrow.png"></img>Back</button>
        </div>
        <div class=secondaryText" id="secondaryErrorMessage"></div>
    </div>
    `;
    document.getElementById("employeeName").innerHTML = "Hello, " + teacherName + ".";
    setEventsOnClicked("backButton", loadMainPage);
    setEventsOnClicked("clockIn", updateTimecard, "1");
    setEventsOnClicked("clockOut", updateTimecard, "2");
}
function loadSecondaryPage()
{
    // Load in clock in or out page
    document.getElementById("changeableContentSpace").innerHTML = `    
    <div id="secondaryPage">
        <div id="secondaryTextDiv">
            <div class="secondaryText", id="employeeName"></div>
            <div class="secondaryText">
                Do you want to clock in or out?
            </div>
        </div>
        <div id="timesheetBoxesDiv1">
            <div class="timesheetBox">
                <div class="timesheetCell topRow">Clock in</div>
                <div class="timesheetCell topRow">Clock out</div>
                <div class="timesheetCell topRow">Hours</div>
                <div class="timesheetCell topRow">Branch</div>
                <div class="timesheetCell topRow lastCell">Notes</div>
            </div>
            <div class="timesheetBox">
                <div class="timesheetCell bottomRow" id="recentDataDisplay1"></div>
                <div class="timesheetCell bottomRow" id="recentDataDisplay2"></div>
                <div class="timesheetCell bottomRow" id="recentDataDisplay3"></div>
                <div class="timesheetCell bottomRow" id="recentDataDisplay4"></div>
                <div class="timesheetCell bottomRow lastCell" id="recentDataDisplay5"></div>
            </div>
        </div>
        <div id="arrowDiv">
            <img src="static/images/Arrow.png" style="height: 20px; transform: rotate(-90deg)">
        </div>
        <div id="timesheetBoxesDiv2">
            <div class="timesheetBox">
                <div class="timesheetCell topRow">Clock in</div>
                <div class="timesheetCell topRow">Clock out</div>
                <div class="timesheetCell topRow">Hours</div>
                <div class="timesheetCell topRow">Branch</div>
                <div class="timesheetCell topRow lastCell">Notes</div>
            </div>
            <div class="timesheetBox">
                <div class="timesheetCell bottomRow" id="dataDisplay1"></div>
                <div class="timesheetCell bottomRow" id="dataDisplay2"></div>
                <div class="timesheetCell bottomRow" id="dataDisplay3"></div>
                <div class="timesheetCell bottomRow" id="dataDisplay4"></div>
                <div class="timesheetCell bottomRow lastCell" id="dataDisplay5">
                    <input type="text", id="editableNotesDiv" placeholder="Write notes here..."></input>
                </div>
            </div>
        </div>
        <div id="timesheetBoxesDiv3">
            <div class="timesheetBox">
                <div id="punchButtons">
                    <button class="goodButton" id="clockIn"><img src="static/images/White arrows.png", class="punchImg"></img></button>
                    <button class="badButton" id="clockOut"><img src="static/images/White arrows.png", class="punchImg"></img></button>
                </div>
            </div>
        </div>
        <div id="timesheetBoxesDiv4">
            <div id="secondaryErrorMessage"></div>
            <div class="timesheetBox", id="newSubmitButtonDiv">
                <button id="newSubmitButton">SUBMIT</button>
            </div>
            <div class="timesheetBox">
                <button class="verySmallButton", id="backButton"><img src="static/images/Arrow.png"></img>Back</button>
            </div>
        </div>
    </div>
    `;
    collectFileData();
    document.getElementById("employeeName").innerHTML = "Hello, " + teacherName + ".";
    setEventsOnClicked("backButton", loadMainPage);
    setEventsOnClicked("clockIn", clockInButton);
    setEventsOnClicked("clockOut", clockOutButton);
    setEventsOnClicked("newSubmitButton", updateTimecard);
}
function loadThirdPage()
{
    // Load in forgot ID page
    document.getElementById("changeableContentSpace").innerHTML = `
        <div id="thirdPage">
            <div class="thirdPageDiv", id="thirdTextDiv">
                <div class="thirdText">Please type your ID code into the box below. <b>Do not type any zeroes.</b> Contact your branch manager for further assistance.</div>
            </div>
            <div class="thirdPageDiv", id="fillBarDiv">
                <div id="fillBar">
                    <input type="text" id="userInput", placeholder="ID code", autofocus>
                </div>
                <div id="submitButtonDiv">
                    <button type="submit", id="submitButton"><img src="static/images/Search icon (black).png" alt="Search"></button>
                </div>
            </div>
            <div id="errorLog"></div>
            <div class="thirdPageDiv", id="thirdBackButtonDiv">
                <button class="smallButton greyButton", id="backButton"><img src="static/images/Arrow.png"></img>Back</button>
            </div>
        </div>
    `;
    setEventsOnClicked("backButton", loadMainPage);
    setEventsOnClicked("submitButton", checkIDNumber);
    var input = document.getElementById("userInput");
    input.addEventListener("keyup", function(event) {
        if (event.key === "Enter") 
            checkIDNumber();
    });
}

// Punch system
function clockInButton()
{
    // Get the time and subtract five minutes from it
    const date = new Date();
    date.setMinutes(date.getMinutes() - 5); // Subtract 5 minutes
    let hours = date.getHours();
    let minutes = date.getMinutes();
    minutes = String(minutes).padStart(2, '0');
    const militaryTime = `${hours}:${minutes}`;
    // Insert information
    timeTableUpdate(document.getElementById("clockIn"), document.getElementById("clockOut"), 
    document.getElementById("dataDisplay1"), document.getElementById("dataDisplay2"), 
    document.getElementById("recentDataDisplay2").innerHTML, "CLOCK IN", militaryTime);
    // Adjust hours
    document.getElementById("dataDisplay3").innerHTML = document.getElementById("recentDataDisplay3").innerHTML;
}
function clockOutButton()
{
    // Get the time and Add five minutes to it
    const date = new Date();
    date.setMinutes(date.getMinutes() + 5); // Add 5 minutes
    let hours = date.getHours();
    let minutes = date.getMinutes();
    minutes = String(minutes).padStart(2, '0');
    const militaryTime = `${hours}:${minutes}`;
    // Insert information
    timeTableUpdate(document.getElementById("clockOut"), document.getElementById("clockIn"), 
    document.getElementById("dataDisplay2"), document.getElementById("dataDisplay1"), 
    document.getElementById("recentDataDisplay1").innerHTML, "CLOCK OUT", militaryTime);
    // Adjust hours
    if (document.getElementById("dataDisplay1").innerHTML != "" && document.getElementById("dataDisplay1").innerHTML != null)
    {
        let hoursWorked = calculateHoursWorked(document.getElementById("dataDisplay1").innerHTML, hours);
        document.getElementById("dataDisplay3").innerHTML = hoursWorked;
        // ADD ERROR CHECKS AND EDGE CASE HANDLING!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    }
}
function timeTableUpdate(theButton1, theButton2, theDataDisplay1, theDataDisplay2, theRecentDataDisplay, message, time)
{
    // Switch clock in button to other button class
    theButton1.classList.add("goodButton");
    theButton1.classList.remove("badButton");
    // Switch clock out button to other button class
    theButton2.classList.add("badButton");
    theButton2.classList.remove("goodButton");
    // Add time to timesheet cell
    theDataDisplay1.innerHTML = time;
    theDataDisplay2.innerHTML = theRecentDataDisplay
    theDataDisplay1.style.backgroundColor = "#c6f5ffff";
    theDataDisplay2.style.backgroundColor = "white";
    // Change submit button text
    document.getElementById("newSubmitButton").innerHTML = message;
}
function updateTimecard() {
    // Store punch data in JSON object
    const dataToSend = {
        owner: teacherName,
        var1: document.getElementById("dataDisplay1").innerHTML,
        var2: document.getElementById("dataDisplay2").innerHTML,
        var3: document.getElementById("dataDisplay4").innerHTML,
        var4: document.getElementById("editableNotesDiv").value
    }
    // Send data to Python
    $.ajax({
        url: '/update',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(dataToSend),
        success: function(response) {
            errorMessage = document.getElementById("secondaryErrorMessage")
            if (response == "success")
                loadMainPage();
            else if (response == "fail")
                errorMessage.innerHTML = "Unable to save data due to Python Permission Error. Please close the file if it is open.";
            else
                errorMessage.innerHTML = "Unable to save data due to Python error: " + response + ". Please contact site manager.";
        },
        error: function(error) {
            errorMessage.innerHTML = "Unable to save data due to JavaScript error: " + error + " . Please contact site manager.";
        }
    });
}
function collectFileData()
{
    $.ajax({
        type : "POST",
        url : '/collectFileData',
        data: JSON.stringify(teacherName),
        contentType: 'application/json;charset=UTF-8',
        success: function (myDataObject) {
           // Adjust time to not include seconds
           if (myDataObject.clockin.length > 5)
            myDataObject.clockin = myDataObject.clockin.slice(0, -3);
           if (myDataObject.clockout.length > 5)
            myDataObject.clockout = myDataObject.clockout.slice(0, -3);
           // Assign values of string items
            document.getElementById("recentDataDisplay1").innerHTML = myDataObject.clockin;
            document.getElementById("recentDataDisplay2").innerHTML = myDataObject.clockout;
            document.getElementById("recentDataDisplay4").innerHTML = myDataObject.branch;
            document.getElementById("recentDataDisplay5").innerHTML = myDataObject.notes;
            document.getElementById("dataDisplay1").innerHTML = myDataObject.clockin;
            document.getElementById("dataDisplay2").innerHTML = myDataObject.clockout;
            document.getElementById("editableNotesDiv").value = myDataObject.notes;
            // Set clock in/out displays depending on whether the user has clocked in or not
            if (document.getElementById("dataDisplay1").innerHTML == null || document.getElementById("dataDisplay1").innerHTML == "")
                clockInButton();
            else
                clockOutButton();
            // Set branch to not change or to add to current branch if different from clock in location
            if (myDataObject.branch == document.getElementById("currentBranch").innerHTML || myDataObject.branch == "")
                document.getElementById("dataDisplay4").innerHTML = document.getElementById("currentBranch").innerHTML;
            else
                document.getElementById("dataDisplay4").innerHTML = myDataObject.branch + "/" + document.getElementById("currentBranch").innerHTML;
            }
        });
}
function calculateHoursWorked(clockInTime, clockOutTime)
{
    // Collect correct numbers and convert to integers
    let clockInHour = String(clockInTime).split(":", 1);
    clockInHour = parseInt(clockInHour);
    clockOutHour = clockOutTime;
    // Calculate hours worked minus one hour for lunch on long days
    let talliedHours = clockOutHour - clockInHour;
    if (clockInHour < 12 && clockOutHour > 12)
        talliedHours = talliedHours - 1;

    return talliedHours;
}

// Encryption/decryption of user ID
function encrypt(name)
{
    var newName = "";

    // Replace letters in name with encrypted version
    for (let x = 0; x < name.length; x++)
        for (let i = 0; i < ABC.length; i++)
            if (name[x].toUpperCase() == ABC[i])
                newName = newName + encryptionKey[i];
    // Add zeroes to remaining spaces in name
    for (let y = 0; y < 12 - name.length; y++)
        newName = newName + "0";

    return newName;
}
function decrypt(encryptedName)
{
    var decryptedName = "";

    // Search for letter equivalents in encryption key
    for (let x = 0; x < encryptedName.length; x++)
    {
        for (let i = 0; i < encryptionKey.length; i++)
        {
            if (encryptedName[x].toUpperCase() == encryptionKey[i])
            {
                if (x == 0)
                    decryptedName = decryptedName + ABC[i];
                else
                    decryptedName = decryptedName + ABC[i].toLowerCase();
            }
            // Consider name fully decrypted if a zero is found
            if (encryptedName[x] == "0")
                break;
        }
    }

    return decryptedName;
}

// For use only on the third page
function checkIDNumber()
{
    var inputValue = document.getElementById("userInput").value;
    teacherName = decrypt(inputValue);
    if (nameIsInArray(teacherName, teacherNamesArray) == true) 
        loadSecondaryPage();
    else
        document.getElementById("errorLog").innerHTML = `Incorrect ID. Please try again or check directory for issues.`;
}

// Directory functions
function changeDirectory() {
    $.ajax({
        type : "POST",
        url : '/changeDirectory',
        dataType: "json",
        contentType: 'application/json;charset=UTF-8',
        success: function (dataObject) {
            document.getElementById("userID").placeholder = dataObject.fp;
            document.getElementById("teacherNamesDataPass").dataset.value = JSON.stringify(dataObject.tn);
            teacherNamesDataPassString = document.getElementById("teacherNamesDataPass").dataset.value;
            teacherNamesArray = parseNamesList(teacherNamesDataPassString);
            adjustTeacherCountCircle(dataObject.tnc);
            }
        });
}
function adjustTeacherCountCircle(teacherCount) {
    document.getElementById("nameCheckInterior").innerHTML = teacherCount;
    if (teacherCount == 0) {
        document.getElementById("nameCheckExterior").style.backgroundColor = "#ff0000";
        document.getElementById("nameCheckInterior").style.color = "#ff0000";
    }
    else {
        document.getElementById("nameCheckExterior").style.backgroundColor = "#008000";
        document.getElementById("nameCheckInterior").style.color = "#008000";
    }
}

// Continuous update of clock in header
function updateClock() {
    const currentDatetime = new Date();
    let currentDate = currentDatetime.toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    let hours = currentDatetime.getHours();
    let minutes = currentDatetime.getMinutes();
    minutes = String(minutes).padStart(2, '0');
    const militaryTime = `${hours}:${minutes}`;

    const myDate = militaryTime + " " + currentDate;
    const datePlace = document.getElementById("datetime");
    if (datePlace)
        datePlace.innerHTML = myDate;
}

// Set events to a button
function setEventsOnClicked(buttonID, myFunction, argument)
{
    const myButton = document.getElementById(buttonID);
    myButton.addEventListener('click', function () {
        myFunction(argument);
    });
}
// Basic mathematical functions
function isLetter(str)
{
    return str.toLowerCase() != str.toUpperCase();
}
function parseNamesList(namesList)
{
    const myArray = [];
    let myName = "";
    let currentlyParsingName = false;

    // Loop through every character in string. If alphabetical character is found, start a new name. 
    // When non-alphabetical character is found, append current name to list and start over.
    for (let i = 0; i < namesList.length; i++)
    {
        if (isLetter(namesList[i]) == true)
        {
            myName = myName + namesList[i];
            currentlyParsingName = true;
        }
        else if (isLetter(namesList[i]) == false && currentlyParsingName == true)
        {
            currentlyParsingName = false;
            myArray.push(myName);
            myName = "";
        }
    }

    return myArray;
}
function nameIsInArray(nameToCheck, listToCheck)
{
    // Check each name in teachers list for name. Return true if found or false otherwise
    for (let i = 0; i < listToCheck.length; i++)
        if (nameToCheck == listToCheck[i])
            return true;

    return false;
}
