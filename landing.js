const electron = require('electron').remote
const date = require('date-and-time');
const axios = require('axios');
const fs = require('fs')
const path = require('path');
const os = require('os');
const { ipcRenderer } = window.require('electron');
var Chart = require('chart.js');

//read the username first and then start the data collection
const jsonfile = path.join(__dirname,'./electronuser.json')
fs.readFile(jsonfile, 'utf8', (err, userString) => {
    if (err) {
        console.log("Error reading json file from disk:", err)
        return
    }
    try {
          const user = JSON.parse(userString)
          const computerName = os.hostname() + ' ' + os.type()

          //indicates that the app is active
          // event 0 - app is activated
          makePostRequest(user.username,computerName,0)
          monitorDailyState(user.username,computerName)
          postAdditionalComputerStates(user.username,computerName)
          ipcRendererEvents(user.username,computerName)

        }
   catch(err) {
          console.log('Error parsing JSON string:', err)
      }
})

async function makePostRequest(username,computerName,eventid) {
  try{
    now = new Date();
    let res = await axios.post('https://health-iot.labs.vu.nl/api/idlestate/event',
      {
        userid: username,
        deviceid: computerName,
        collectionTime: Math.floor((now.getTime() - now.getTimezoneOffset() *  60000)/1000),
        eventid: eventid
      }
    );

    console.log(res.data);
  } catch (err) {
        // Handle Error Here
        console.error(err);
    }
}

function ipcRendererEvents(username,computerName){
  console.log('Registering ipc render events')
  //Display latest idle state data
  ipcRenderer.on('MSG_SHOW_PLOT', (event, data) => {

    var start = new Date();
    start.setHours(0,0,0,0);
    var end = new Date();
    var startdate = Math.floor((start.getTime() - start.getTimezoneOffset() *  60000)/1000)
    var enddate = Math.floor((end.getTime() - end.getTimezoneOffset() *  60000)/1000)

    //call the api
    var apiCall = 'https://health-iot.labs.vu.nl/api/idlestate/user/'+ username+'/device/'+ computerName
    +'/startdate/'+ startdate+'/enddate/'+ enddate
    axios.get(apiCall)
      .then(function (response) {
        // handle success
        // console.log(response.data.intervals);
        var intervals = response.data.intervals
        var timeArray2 = []
        var stateArray = []
        for (i in intervals){
          var d = new Date(intervals[i].collectionTime*1000)
          // timeArray2.push(new Date(intervals[i].collectionTime*1000).toLocaleTimeString('it-IT'))
          timeArray2.push(d.getUTCHours() + ":" + d.getUTCMinutes())
          // console.log(new Date(intervals[i].collectionTime*1000).getUTCHours(),intervals[i].collectionTime)
          stateArray.push(intervals[i].idleTime)
        }
        // console.log(apiCall)
        // console.log(timeArray2);
        // console.log(stateArray);

        //no daily data to show on the plot
        if(timeArray2.length == 0 || stateArray.length == 0)
        {

        }
        else{
            createDailyChart(stateArray,timeArray2)
        }


      })
      .catch(function (error) {
        // handle error
        console.log(error);
      })
      .then(function () {
        // always executed
      });

    });

  ipcRenderer.on('app-close', _ => {
        console.log('renderer closing')
        makePostRequest(username,computerName,1)
        ipcRenderer.send('closed');
  });

}

Date.prototype.getUTCTime = function(){
  return this.getTime()-(this.getTimezoneOffset()*60000);
};

function createDailyChart(stateArray,timeArray){

              var ctx = document.getElementById('myChart').getContext('2d');
              var myChartSitting = new Chart(ctx, {
                              type: 'line',
                              responsive:true,
                              data: {
                                  labels: timeArray,
                                  datasets: [{
                                      data:stateArray,
                                      steppedLine: true,
                                      // backgroundColor: [
                                      //     'rgba(113, 121, 250, 1)'
                                      // ],
                                      borderColor: [
                                          'rgba(113, 121, 250,1)'
                                      ],
                                      borderWidth: 2
                                  }]
                              },
                              options: {
                                legend: {
                                     display: false
                                 },
                                  scales: {
                                      yAxes: [{
                                          scaleLabel: {
                                              display: true,
                                              fontColor: "#CCC",
                                              labelString: 'Computer usage',
                                              fontSize: 14
                                          },  gridLines: {drawBorder: false,
                                                display:false
                                            },
                                            ticks: {
                                              beginAtZero: true,
                                              callback: function (value) { if (Number.isInteger(value)) { return value; } },
                                              stepSize: 1,
                                              fontColor: "#CCC"
                                          }
                                      }],
                                      xAxes: [{
                                          scaleLabel: {
                                              display: true,
                                              fontColor: "#CCC",
                                              labelString: 'Time'
                                          },
                                          gridLines: {drawBorder: false,
                                            display:false
                                          },
                                          ticks: {
                                              beginAtZero:true,
                                              fontColor: "#CCC"
                                          }
                                      }]
                                  },

                                  animation: {
                                      duration:1000,
                                      easing:'easeOutCubic'
                                  }

                              }

                          });

}

function postAdditionalComputerStates(username,computerName){
  console.log('Registering Additional Computer States...')

  //different states - see if it is useful to save them to database as well
  //suspend - 2
  electron.powerMonitor.on('suspend', () => {
    now = new Date();
    console.log(date.format(now, 'YYYY/MM/DD HH:mm:ss') +' The system is going to sleep');
    var event = document.getElementById("event");
    event.innerText = ' The system is going to sleep'


    axios.post('https://health-iot.labs.vu.nl/api/idlestate/event',
      {
        userid: username,
        deviceid: computerName,
        collectionTime: Math.floor((now.getTime() - now.getTimezoneOffset() *  60000)/1000),
        eventid: 2
      }
    )
    .then((response) => {
      console.log('POST OK');
    }, (error) => {
      console.log(error);
    });

  });

  //resume - 3
  electron.powerMonitor.on('resume', () => {
    now = new Date();
    console.log(date.format(now, 'YYYY/MM/DD HH:mm:ss') +' The system is resuming');
    var event = document.getElementById("event");
    event.innerText = ' The system is resuming'

    axios.post('https://health-iot.labs.vu.nl/api/idlestate/event',
      {
        userid: username,
        deviceid: computerName,
        collectionTime: Math.floor((now.getTime() - now.getTimezoneOffset() *  60000)/1000),
        eventid: 3
      }
    )
    .then((response) => {
      console.log('POST OK');
    }, (error) => {
      console.log(error);
    });

  });

  // on-ac 4
  electron.powerMonitor.on('on-ac', () => {
    now = new Date();
    console.log(date.format(now, 'YYYY/MM/DD HH:mm:ss') +' The system is on AC Power (charging)');
    var event = document.getElementById("event");
    event.innerText =' The system is on AC Power (charging)'

    axios.post('https://health-iot.labs.vu.nl/api/idlestate/event',
      {
        userid: username,
        deviceid: computerName,
        collectionTime: Math.floor((now.getTime() - now.getTimezoneOffset() *  60000)/1000),
        eventid: 4
      }
    )
    .then((response) => {
      console.log('POST OK');
    }, (error) => {
      console.log(error);
    });


  });

  // on-battery 5
  electron.powerMonitor.on('on-battery', () => {
       now = new Date();
      console.log(date.format(now, 'YYYY/MM/DD HH:mm:ss') +' The system is on Battery Power');
      var event = document.getElementById("event");
      event.innerText = ' The system is on Battery Power'

      axios.post('https://health-iot.labs.vu.nl/api/idlestate/event',
        {
          userid: username,
          deviceid: computerName,
          collectionTime: Math.floor((now.getTime() - now.getTimezoneOffset() *  60000)/1000),
          eventid: 5
        }
      )
      .then((response) => {
        console.log('POST OK');
      }, (error) => {
        console.log(error);
      });
  });

  // shutdown 6
  electron.powerMonitor.on('shutdown', () => {
       now = new Date();
      console.log(date.format(now, 'YYYY/MM/DD HH:mm:ss') +' The system is Shutting Down');
      var event = document.getElementById("event");
      event.innerText = ' The system is Shutting Down'

      axios.post('https://health-iot.labs.vu.nl/api/idlestate/event',
        {
          userid: username,
          deviceid: computerName,
          collectionTime: Math.floor((now.getTime() - now.getTimezoneOffset() *  60000)/1000),
          eventid: 6
        }
      )
      .then((response) => {
        console.log('POST OK');
      }, (error) => {
        console.log(error);
      });
  });

  // lockscreen 7
  electron.powerMonitor.on('lock-screen', () => {
       now = new Date();
      console.log(date.format(now, 'YYYY/MM/DD HH:mm:ss') +' The system is about to be locked');
      var event = document.getElementById("event");
      event.innerText = ' The system is about to be locked'

      axios.post('https://health-iot.labs.vu.nl/api/idlestate/event',
        {
          userid: username,
          deviceid: computerName,
          collectionTime: Math.floor((now.getTime() - now.getTimezoneOffset() *  60000)/1000),
          eventid: 7
        }
      )
      .then((response) => {
        console.log('POST OK');
      }, (error) => {
        console.log(error);
      });
  });


  //unlock-screen
  electron.powerMonitor.on('unlock-screen', () => {
       now = new Date();
      console.log(date.format(now, 'YYYY/MM/DD HH:mm:ss') +' The system is unlocked');
      var event = document.getElementById("event");
      event.innerText = ' The system is unlocked'
      axios.post('https://health-iot.labs.vu.nl/api/idlestate/event',
        {
          userid: username,
          deviceid: computerName,
          collectionTime: Math.floor((now.getTime() - now.getTimezoneOffset() *  60000)/1000),
          eventid: 8
        }
      )
      .then((response) => {
        console.log('POST OK');
      }, (error) => {
        console.log(error);
      });
  });

}


function monitorDailyState(username,computerName){
    console.log('Monitoring daily state...')
    // posting state changes
    // threshold in seconds for changing states
    const idleThreshold = 20
    var last_state = ''
    var current_state = ''
    var idleState = -1

    setInterval(function(){
        now = new Date();
        // in case you want to have the actual idle time
        // const idle = electron.powerMonitor.getSystemIdleTime();
        // console.log(date.format(now, 'YYYY/MM/DD HH:mm:ss') +' Current System Idle Time - ', idle);
        // var idletime = document.getElementById("idletime");
        // idletime.innerText = idle
        const st = electron.powerMonitor.getSystemIdleState(idleThreshold);
        // document.getElementById("state").innerText = st
        current_state = st

        if(current_state == 'active')
          idleState = 1
        else
          idleState = 0

        console.log(date.format(now, 'YYYY/MM/DD HH:mm:ss') +' Current System State - ', st, idleState , Math.floor((now.getTime() - now.getTimezoneOffset() *  60000)/1000),username,computerName);

        if(last_state != current_state){
            axios.post('https://health-iot.labs.vu.nl/api/idlestate/post',
              {
                userid: username,
                deviceid: computerName,
                collectionTime: Math.floor((now.getTime() - now.getTimezoneOffset() *  60000)/1000),
                idleTime: idleState
              }
            )
            .then((response) => {
              console.log('POST OK');
            }, (error) => {
              console.log(error);
            });

            last_state = current_state
        }
      }, 5000);

  }
