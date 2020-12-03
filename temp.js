//Object that will contain the relevant information for each xml file according to the assignment
const data = {
    'cases': {},
    'testing': {},
    'hospital': {}
}

//resolver for data fetching functions from the xml files
const dataFetchingFunctionsResolver = {
    'cases': extractDataFromCases,
    'testing': extractDataFromTesting,
    'hospital': extractDataFromHospital
}

const groupByFunctionsResolver = {
    'daily': dailyData,
    'monthly': '',
    'average': ''
}


//initialization of the table
const table = "<tr><th>Date</th><th>Cases</th><th>Tests</th><th>Testing Capacity</th><th>Patients in Hospitals</th></tr>";

//loading the xmlFiles
Object.keys(data).map((fileName) => loadXMLDoc(fileName))

//TODO: remove this console.log
// console.log(filterDataByMonth(table, data, 11));

//load each xml file, and adding the relevant information to the `data` object (synchronized fetching of data)`
function loadXMLDoc(fileName) {
    const xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            data[fileName] = dataFetchingFunctionsResolver[fileName](this.responseXML)
        }
    };
    xmlHttp.open("GET", `${fileName}.xml`, false);
    xmlHttp.send();
}

//extract the date and newCasesByPublishDate from the cases xml
function extractDataFromCases(xmlDocument) {
    const Data = Array.from(xmlDocument.getElementsByTagName('data'));
    return Data.reduce((acc, data) => {
        return [...acc, {date: data.children[3].innerHTML, cases: data.children[4].innerHTML}]
    }, [])
}

//extract the date, newPCRTestsByPublishDate and plannedPCRCapacityByPublishDate from the testing xml
function extractDataFromTesting(xmlDocument) {
    const Data = Array.from(xmlDocument.getElementsByTagName('data'));
    return Data.reduce((acc, data) => {
        return [...acc, {
            date: data.children[3].innerHTML,
            tests: data.children[4].innerHTML,
            testCapacity: data.children[6].innerHTML
        }]
    }, [])
}

//extract the date and hospitalCases from the hospital xml
function extractDataFromHospital(xmlDocument) {
    const Data = Array.from(xmlDocument.getElementsByTagName('data'));
    return Data.reduce((acc, data) => {
        return [...acc, {date: data.children[3].innerHTML, hospitalCases: data.children[4].innerHTML}]
    }, [])
}

//TODO: add the change by type to the filtered Data
//creates a filtered data by month
function filterDataByMonth(data, month, type) {
    const filteredData = []
    Object.keys(data).map((file) => {
        filteredData[file] = data[file].filter(item => {
            return item.date.substr(5, 2) === month
        })
    })
    return filteredData;
}

function dailyData() {

}

//creates a filtered data by date relative to the condition provided
function filterDataByDate(data, date, condition) {
    const filterFunctions = {
        'equal': val => val.date === date.toString(),
        'bigger': val => val.date > date.toString(),
        'lesser': val => val.date < date.toString()
    }
    const filteredData = []
    Object.keys(data).map((file) => {
        filteredData[file] = data[file].filter(filterFunctions[condition])
    })
    return filteredData;
}

function createTableByMonth(month, groupBy) {
    const filteredData = filterDataByMonth(data, month);
    console.log(filteredData);
    console.log(groupBy)
}

// const temp = {}
// $(document).ready(() => {
//     $.ajax({
//         type: 'GET',
//         url: `cases.xml`,
//         dataType: `xml`,
//         success: (xml) => {
//             $(xml).find('date').each((val) => console.log(val))
//         }
//     })
// })
