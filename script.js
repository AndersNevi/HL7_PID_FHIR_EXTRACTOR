let patientResource = null;



const genderMap = {
    M: "male",
    F: "female",
    U: "unknown",
    O: "other", 
    "1": "male",
    "2": "female"
};

function handleClick() {
    let value = document.getElementById("hl7Input").value;
    let segments = value.split(/\r\n|\r|\n|\\r/);
    console.log(segments);
    let PIDSegment = segments.find(segment => segment.startsWith('PID|'));
    if (segments.length === 1) {
        let PID = value.split("PID");
        if (PID.length < 2) {
            alert("INVALID MESSAGE, MISSING PID");
            return;
        }
        PIDSegment = "PID" + PID[1];
    }
    if (PIDSegment === undefined) {
        alert("INVALID MESSAGE, MISSING PID");
        return;
    }
    let pidArr = PIDSegment.split("|"); //convert hl7 string to array
    patientResource = {"resourceType": segmentId(pidArr[0]), 
    "identifier": [
    {
        "system": "https://fhir.nhs.uk/Id/nhs-number",
        "value": getNhsId(pidArr[3])
    }], 
    "name": [formatName(pidArr[5])],
    "gender": formatGender(pidArr[8]),
    "birthDate": formatDate(pidArr[7]),
    "address": [formatAddress(pidArr[11])],
    "telecom": formatPhone(pidArr[13])
    };
    document.getElementById("fhirMes").textContent = JSON.stringify(patientResource);
}





function segmentId(segmentId) {
    /**
     * Checks for prsence of PID segment returns resource type "Patient"
     * Returns resource type "Patient" for valid PID segments
     * */
    if (segmentId === "PID") {
        return("Patient");
    }
    else {
        alert("HL7 segment is not PID");
    }
}

function getNhsId(id) {
    /**
     * Strips NHS number from HL7 nhs number field
     * Returns NHS number only
    */
    let idArr = id.split("^");
    return(idArr[0]);
}



function formatName(hl7Name) {
    /**
     * Strips and formats patient name from HL7 name field
     * Returns FHIR compliant patient name
    */
    let nameArr = hl7Name.split("^"); 
    let fhirName = {
        family: nameArr[0],
        given: [nameArr[1], nameArr[2]].filter(Boolean)//only show names with a value
    }
    return(fhirName);
}



function formatGender(gender) {
    /**
     * Compares gender key to map
     * Returns gender from map
    */
    return(genderMap[gender]);
}


function formatDate(hl7Date) {
    /**
     * Strips and formats patient date of birth
     * Returns FHIR compliant date of birth
    */
    let date = hl7Date;
    let year = date.slice(0, 4);
    let month = date.slice(4, 6);
    let day = date.slice(6, 8);
    let isoDate = `${year}-${month}-${day}`
    return(isoDate);
}


function formatAddress(adrs) {
    /**
     * Strips and formats patient address
     * Returns FHIR compliant address
    */
    let homeAdrs;
    let addresses = adrs.split("~");
    if (addresses.length > 1) {
        for (let i = 0; i < addresses.length; i++) {
            let parts = addresses[i].split("^");
            if (parts[6] === "H") {
                homeAdrs = addresses[i];
            }
        }
        if (homeAdrs === undefined) {
            homeAdrs = addresses[0];
        }
    }
    else {
        homeAdrs = addresses[0];
    }
    let adrsArr = homeAdrs.split("^");
    let line = adrsArr.slice(0, 2).filter(Boolean);
    let fmtAdrs = 
        {
            "use": "home",
            "type": "both",
            "line": line,
            "city": adrsArr[2] || undefined,
            "district": adrsArr[3] || undefined,
            "postalCode": adrsArr[4] || undefined, 
            "country": adrsArr[5] || "GB"
        }
    return(fmtAdrs);
}

function formatPhone(phoneNumber) {
    /**
     * Strips and formats patient phone number
     * Returns FHIR compliant phone number
    */
    let num
    let numbers = phoneNumber.split("~");
    console.log(numbers);
    if (numbers.length > 1) {
        for (let i = 0; i < numbers.length; i++) {
            let parts = numbers[i].split("^");
            if (parts[1] === "PRN") {
                num = parts[0];
            }
        }
    }
    else {
        num = phoneNumber.split("^")[0];
    }
    let fhirPhone = [{
        "system": "phone",
        "value": num,
        "use": "mobile"
    }]
    return(fhirPhone);
}


async function sendToDatabase() {

    if (patientResource === null) {
        alert("No Patient Resource Generated");
        return
    }
    try {const response = await fetch(
        "http://localhost:3000/patient",
        {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(patientResource)
        }

        
        );
        console.log(responce);
        alert("Request Sent");
    }
    catch(error) {
        console.log(error);
        alert("Connection Failed");
    }
    
    
}