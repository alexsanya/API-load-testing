(() => {
  'use strict';

    const config = {
      auth: {
        email: 'load-test-final-7@staff.dev',
        password: 'loadtest',
      },
      apps: {
        neutral: [
          {
            name: 'gedit',
            titles: ['document1', 'readme.txt', 'some file'],
          },
          {
            name: 'sublime',
            titles: ['index.js', 'app.js', 'readme.txt'],
          },
        ],
        unproductive: [
          {
            name: 'vmplayer',
            titles: ['song.mp3', 'film.mp4', 'my_playlist'],
          },
          {
            name: 'Chromium',  
            titles: ['nba.com'],
            urls: ['http://stats.nba.com/players/?ls=iref:nba:gnav',
              'http://www.nba.com/celtics/?ls=iref:nba:gnav',
              'http://www.nba.com/celtics/video/channel/team_originals'
            ],
          },
          {
            name: 'Firefox',
            titles: ['youtube.com'],
            urls: ['https://www.youtube.com/watch?v=VgauRf2dB1k',
              'https://www.youtube.com/watch?v=aQkzKh649cw',
              'https://www.youtube.com/watch?v=ml7f14t19fk'
            ],
          },
        ],
        productive: [
          {
            name: 'Safari',
            titles: ['logentries.com'],
            urls: ['https://docs.logentries.com/docs/best-practices-logs',
              'https://logentries.com/product/',
              'https://logentries.com/resources/webinars/'
            ],
          },
          {
            name: 'Chrome',
            titles: ['doc.qt.io'],
            urls: ['http://doc.qt.io/qt-5/overviews-main.html',
              'https://www.qt.io/services/',
              'https://www.qt.io/developers/'
            ],
          },
          {
            name: 'Firefox',
            titles: ['screencast.com'],
            urls: ['http://www.screencast.com/tos.aspx',
              'http://www.screencast.com/pricing.aspx',
              'https://www.screencast.com/keysignup.aspx'
            ],
          },
          {
            name: 'Lightshot',
            titles: ['screenshot.png', 'Lightshot', 'Options'],
          },
        ],
      },
      performanceDefinitions: {
        lazy: {
          unproductive: 0.5,
          neutral: 0.25,
          productive: 0.25,
        },
        normal: {
          unproductive: 0.25,
          neutral: 0.25,
          productive: 0.5,
        },
        effective: {
          unproductive: 0,
          neutral: 0.25,
          productive: 0.75,
        },
      },
      screenShots: [
        {
          filename: '../screenshots/1.jpg',
          metadata: {
            blur: false,
            imageSize: 84096,
            h: 768,
            w: 1366,
            contentType: 'image/jpeg',
            period: 20,
            quality: 30,
            scale: 100,
            screenNumber: 0,
            type: 'screenshot',
          }
        },
        {
          filename: '../screenshots/2.jpg',
          metadata: {
            blur: false,
            imageSize: 113640,
            h: 768,
            w: 1366,
            contentType: 'image/jpeg',
            period: 20,
            quality: 30,
            scale: 100,
            screenNumber: 0,
            type: 'screenshot',
          }
        },
        {
          filename: '../screenshots/3.jpg',
          metadata: {
            blur: false,
            imageSize: 68388,
            h: 768,
            w: 1366,
            contentType: 'image/jpeg',
            period: 20,
            quality: 30,
            scale: 100,
            screenNumber: 0,
            type: 'screenshot',
          }
        },
      ]
  };

  module.exports = config;
})();
