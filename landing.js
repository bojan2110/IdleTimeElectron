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
          monitorState(user.username)

        }
   catch(err) {
          console.log('Error parsing JSON string:', err)
      }
})

function monitorState(username)
{
      var start = new Date();
      start.setHours(0,0,0,0);
      var end = new Date();

      var startdate = Math.floor((start.getTime() - start.getTimezoneOffset() *  60000)/1000)
      var enddate = Math.floor((end.getTime() - end.getTimezoneOffset() *  60000)/1000)

      const computerName = os.hostname() + ' ' + os.type()

      //every time the show window is called we want to display latest idle state data
      ipcRenderer.on('MSG_SHOW_PLOT', (event, data) => {
        //call the api
        axios.get('https://health-iot.labs.vu.nl/api/idlestate/user/'+ username+'/device/'+ computerName
        +'/startdate/'+ startdate+'/enddate/'+ enddate)
          .then(function (response) {
            // handle success
            // console.log(response.data.intervals);
            var intervals = response.data.intervals
            var timeArray = []
            var stateArray = []
            var chartData = []
            for (i in intervals){
              chartData.push({
              "x" : intervals[i].collectionTime,
              "y"  : intervals[i].idleTime})
              timeArray.push(new Date(intervals[i].collectionTime).getHours()+':'+new Date(intervals[i].collectionTime).getMinutes())
              stateArray.push(intervals[i].idleTime)
            }

            console.log(chartData);



            var ctx = document.getElementById('myChart').getContext('2d');
            var myChartSitting = new Chart(ctx, {
                            type: 'line',
                            responsive:true,
                            data: {
                                labels: timeArray,
                                datasets: [{
                                    label: 'minutes of sitting',
                                    data:stateArray,
                                    steppedLine: true,
                                    // backgroundColor: [
                                    //     'rgba(113, 121, 250, 1)'
                                    // ],
                                    borderColor: [
                                        'rgba(113, 121, 250,1)'
                                    ],
                                    borderWidth: 1
                                }]
                            },
                            options: {
                              legend: {
                                   labels: {
                                       fontColor: "#CCC",
                                       fontSize: 14
                                   }
                               },
                                scales: {
                                    yAxes: [{
                                        scaleLabel: {
                                            display: true,
                                            fontColor: "#CCC",
                                            labelString: 'Minutes'
                                        },  gridLines: {drawBorder: false,
                                              display:false
                                          },
                                        ticks: {
                                            beginAtZero:true,
                                            fontColor: "#CCC"
                                        }
                                    }],
                                    xAxes: [{
                                        scaleLabel: {
                                            display: true,
                                            fontColor: "#CCC",
                                            labelString: 'Hours of the day'
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
            // var chart = new Chart(ctx, {
            //     type: 'line',
            //     data: [{
            //         x: 1,
            //         y: 1
            //     }, {
            //         x: 2,
            //         y: 10
            //     }],
            //     options: {
            //       lineTension: 0,
            //
            //     }
            // });
            // var myChart = new Chart(ctx, {
            //     type: 'bar',
            //     data: {
            //         labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
            //         datasets: [{
            //             label: '# of Votes',
            //             data: [12, 19, 3, 5, 2, 3],
            //             backgroundColor: [
            //                 'rgba(255, 99, 132, 0.2)',
            //                 'rgba(54, 162, 235, 0.2)',
            //                 'rgba(255, 206, 86, 0.2)',
            //                 'rgba(75, 192, 192, 0.2)',
            //                 'rgba(153, 102, 255, 0.2)',
            //                 'rgba(255, 159, 64, 0.2)'
            //             ],
            //             borderColor: [
            //                 'rgba(255, 99, 132, 1)',
            //                 'rgba(54, 162, 235, 1)',
            //                 'rgba(255, 206, 86, 1)',
            //                 'rgba(75, 192, 192, 1)',
            //                 'rgba(153, 102, 255, 1)',
            //                 'rgba(255, 159, 64, 1)'
            //             ],
            //             borderWidth: 1
            //         }]
            //     },
            //     options: {
            //         scales: {
            //             yAxes: [{
            //                 ticks: {
            //                     beginAtZero: true
            //                 }
            //             }]
            //         }
            //     }
            // });
          })
          .catch(function (error) {
            // handle error
            console.log(error);
          })
          .then(function () {
            // always executed
          });

      });


      //different states - see if it is useful to save them to database as well
      electron.powerMonitor.on('suspend', () => {
        now = new Date();
        console.log(date.format(now, 'YYYY/MM/DD HH:mm:ss') +' The system is going to sleep');
        var event = document.getElementById("event");
        event.innerText = ' The system is going to sleep'
      });

      electron.powerMonitor.on('resume', () => {
        now = new Date();
        console.log(date.format(now, 'YYYY/MM/DD HH:mm:ss') +' The system is resuming');
        var event = document.getElementById("event");
        event.innerText = ' The system is resuming'
      });

      electron.powerMonitor.on('on-ac', () => {
        now = new Date();
        console.log(date.format(now, 'YYYY/MM/DD HH:mm:ss') +' The system is on AC Power (charging)');
        var event = document.getElementById("event");
        event.innerText =' The system is on AC Power (charging)'
      });

      electron.powerMonitor.on('on-battery', () => {
           now = new Date();
          console.log(date.format(now, 'YYYY/MM/DD HH:mm:ss') +' The system is on Battery Power');
          var event = document.getElementById("event");
          event.innerText = ' The system is on Battery Power'
      });

      electron.powerMonitor.on('shutdown', () => {
           now = new Date();
          console.log(date.format(now, 'YYYY/MM/DD HH:mm:ss') +' The system is Shutting Down');
          var event = document.getElementById("event");
          event.innerText = ' The system is Shutting Down'
      });

      electron.powerMonitor.on('lock-screen', () => {
           now = new Date();
          console.log(date.format(now, 'YYYY/MM/DD HH:mm:ss') +' The system is about to be locked');
          var event = document.getElementById("event");
          event.innerText = ' The system is about to be locked'
      });

      electron.powerMonitor.on('unlock-screen', () => {
           now = new Date();
          console.log(date.format(now, 'YYYY/MM/DD HH:mm:ss') +' The system is unlocked');
          var event = document.getElementById("event");
          event.innerText = ' The system is unlocked'
      });


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
        document.getElementById("state").innerText = st
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
