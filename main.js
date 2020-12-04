//Object that will contain the relevant information for each xml file according to the assignment
const data = {
    'cases': {},
    'testing': {},
    'hospital': {}
};

//resolver for data fetching functions from the xml files
const dataFetchingFunctionsResolver = {
    'cases': extractDataFromCases,
    'testing': extractDataFromTesting,
    'hospital': extractDataFromHospital
};

//resolver for data filtering
const groupByFunctionsResolver = {
    'monthly': monthlyData,
    'average': averageData
};

//loading the xmlFiles
Object.keys(data).map((fileName) => loadXMLDoc(fileName));


//load each xml file, and adding the relevant information to the `data` object (synchronized fetching of data)`
function loadXMLDoc(fileName) {
    const xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            data[fileName] = dataFetchingFunctionsResolver[fileName](this.responseXML);
        }
    };
    xmlHttp.open('GET', `${fileName}.xml`, false);
    xmlHttp.send();
}

//extract the date and newCasesByPublishDate from the cases xml
function extractDataFromCases(xmlDocument) {
    const data = Array.from(xmlDocument.getElementsByTagName('data'));
    return data.reduce((acc, data) => {
        return [...acc, {date: data.children[3].innerHTML, cases: data.children[4].innerHTML}];
    }, []);
}

//extract the date, newPCRTestsByPublishDate and plannedPCRCapacityByPublishDate from the testing xml
function extractDataFromTesting(xmlDocument) {
    const Data = Array.from(xmlDocument.getElementsByTagName('data'));
    return Data.reduce((acc, data) => {
        return [...acc, {
            date: data.children[3].innerHTML,
            tests: data.children[4].innerHTML,
            testCapacity: data.children[6].innerHTML
        }];
    }, []);
}

//extract the date and hospitalCases from the hospital xml
function extractDataFromHospital(xmlDocument) {
    const Data = Array.from(xmlDocument.getElementsByTagName('data'));
    return Data.reduce((acc, data) => {
        return [...acc, {date: data.children[3].innerHTML, hospitalCases: data.children[4].innerHTML}];
    }, []);
}

//creates a filtered data by month
function filterDataByMonth(data, month, groupBy) {
    let filteredData = [];
    if (month !== '12' && data) {
        Object.keys(data).map((file) => {
            filteredData[file] = data[file].filter(item => {
                return item.date ? item.date.substr(5, 2) === month : '';
            });
        });
    } else filteredData = {...data};
    return groupBy === 'daily' ? filteredData : groupByFunctionsResolver[groupBy](filteredData);
}

//return the sum of data per month
function monthlyData(data) {
    const date = data.cases[0] ? data.cases[0].date : '';
    data.cases = [data.cases.reduce((acc, item) => {
        return {...acc, cases: parseInt(acc.cases) + parseInt(item.cases)};
    }, {date: date, cases: 0})];
    data.testing = [data.testing.reduce((acc, item) => {
        return {
            ...acc,
            tests: parseInt(acc.tests) + parseInt(item.tests),
            testCapacity: parseInt(acc.testCapacity) + parseInt(item.testCapacity)
        };
    }, {date: date, tests: 0, testCapacity: 0})];
    data.hospital = [data.hospital.reduce((acc, item) => {
        return {...acc, hospitalCases: parseInt(acc.hospitalCases) + parseInt(item.hospitalCases)};
    }, {date: date, hospitalCases: 0})];
    return data;
}

//return the average data per month
function averageData(data) {
    const dataLengths = Object.keys(data).reduce((acc, key) => {
        return {...acc, [key]: data[key].length};
    }, {});
    const currData = {...monthlyData(data)};
    currData.cases[0].cases = currData.cases[0].cases ? [data.cases[0].cases / dataLengths.cases] : 0;
    currData.testing[0].tests = currData.testing[0].tests ? [currData.testing[0].tests / dataLengths.testing] : 0;
    currData.testing[0].testCapacity = currData.testing[0].testCapacity ? [currData.testing[0].testCapacity / dataLengths.testing] : 0;
    currData.hospital[0].hospitalCases = currData.hospital[0].hospitalCases ? [currData.hospital[0].hospitalCases / dataLengths.hospital] : 0;
    let finalData = ({
        ...currData,
        cases: {...currData.cases, cases: currData.cases[0].cases ? currData.cases[0].cases / dataLengths.cases : 0},
        testing: {
            ...currData.testing,
            tests: currData.testing[0].test ? currData.testing[0].tests / dataLengths.testing : 0,
            testCapacity: currData.testing[0].testCapacity ? currData.testing[0].testCapacity / dataLengths.testing : 0
        },
        hospital: {
            ...currData.hospital,
            hospitalCases: currData.hospital[0].hospitalCases ? currData.hospital[0].hospitalCases / dataLengths.hospital : 0
        }
    });
    finalData.cases = [finalData.cases];
    finalData.cases[0].date = currData.cases[0].date;
    finalData.testing = [finalData.testing];
    finalData.hospital = [finalData.hospital];
    return finalData;
}

//creates a filtered data by date relative to the condition provided
function filterDataByDate(data, date, condition) {
    const filterFunctions = {
        'equal': val => val.date === date.toString(),
        'bigger': val => val.date > date.toString(),
        'lesser': val => val.date < date.toString()
    };
    const filteredData = [];
    Object.keys(data).map((file) => {
        filteredData[file] = data[file].filter(filterFunctions[condition]);
    });
    return filteredData;
}

//creates a table by month selection and the chosen groupBy
function createTableByMonth(month, groupBy) {
    let table = '<tr><th>Date</th><th>Cases</th><th>Tests</th><th>Testing Capacity</th><th>Patients in Hospitals</th></tr>';
    const filteredData = filterDataByMonth(data, month, groupBy);
    const length = filteredData.cases.length;
    for (let i = 0; i < length; i++) {
        if (filteredData.cases[i] === undefined) {
            filteredData.cases[i] = {date: '', cases: ''};
        }
        if (filteredData.testing[i] === undefined) {
            filteredData.testing[i] = {tests: '', testCapacity: ''};
        }
        if (filteredData.hospital[i] === undefined) {
            filteredData.hospital[i] = {hospitalCases: ''};
        }
        table += `<tr><td>${filteredData.cases[i].date}</td><td>${filteredData.cases[i].cases}</td><td>${filteredData.testing[i].tests}</td><td>${filteredData.testing[i].testCapacity}</td><td>${filteredData.hospital[i].hospitalCases}</td></tr>`;
    }
    document.getElementById('myTable').innerHTML = '';
    document.getElementById('myTable').innerHTML = table;
}

//creates a table by selected date and
function createTableByDate(date, filter) {
    let table = '<tr><th>Date</th><th>Cases</th><th>Tests</th><th>Testing Capacity</th><th>Patients in Hospitals</th></tr>';
    const filteredData = filterDataByDate(data, date, filter);
    const length = filteredData.cases.length;
    for (let i = 0; i < length; i++) {
        if (filteredData.cases[i] === undefined) {
            filteredData.cases[i] = {date: '', cases: ''};
        }
        if (filteredData.testing[i] === undefined) {
            filteredData.testing[i] = {tests: '', testCapacity: ''};
        }
        if (filteredData.hospital[i] === undefined) {
            filteredData.hospital[i] = {hospitalCases: ''};
        }
        table += `<tr><td>${filteredData.cases[i].date}</td><td>${filteredData.cases[i].cases}</td><td>${filteredData.testing[i].tests}</td><td>${filteredData.testing[i].testCapacity}</td><td>${filteredData.hospital[i].hospitalCases}</td></tr>`;
    }
    document.getElementById('myTable').innerHTML = '';
    document.getElementById('myTable').innerHTML = table;
}
