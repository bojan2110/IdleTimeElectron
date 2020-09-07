const electron = require('electron').remote
const date = require('date-and-time');
const axios = require('axios');
const fs = require('fs')
const path = require('path');



const jsonfile = path.join(__dirname,'./electronuser.json')
//read the username first and then start the data collection
fs.readFile(jsonfile, 'utf8', (err, userString) => {
    if (err) {
        console.log("Error reading file from disk:", err)
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



      var intervalID = setInterval(function(){
        now = new Date();
        console.log(electron)
        const idle = electron.powerMonitor.getSystemIdleTime();
        console.log(date.format(now, 'YYYY/MM/DD HH:mm:ss') +' Current System Idle Time - ', idle + ' Username ' + username);

        var idletime = document.getElementById("idletime");
        idletime.innerText = idle + ' Username ' + username



        const st = electron.powerMonitor.getSystemIdleState(10);
        console.log(date.format(now, 'YYYY/MM/DD HH:mm:ss') +' Current System State - ', st+ ' Username ' + username);
        var state = document.getElementById("state");
        state.innerText = st + ' Username ' + username

        axios.post('https://health-iot.labs.vu.nl/api/idlestate/post',
        {
          userid: username,
          collectionTime: Date.now(),
          idleTime: idle
        })
        .then((response) => {
        console.log('POST OK');
        }, (error) => {
        console.log(error);
        });


      }, 5000);

  }
