const express = require('express');
const redis = require('redis');
const admin = require('firebase-admin');
const { createObjectCsvWriter } = require('csv-writer');

// Firebase 초기화
const serviceAccount = require('/home/hyeseoshin/redis-server-csv/node_modules/google-services.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://flutter-test-df9b9-default-rtdb.asia-southeast1.firebasedatabase.app',
});

// Redis 클라이언트 생성
const redisClient = redis.createClient();
redisClient.on('error', (err) => console.log('Redis Client Error', err));

const app = express();
const port = 3000;

// Firebase에서 데이터 가져와 Redis에 저장하는 함수
async function syncFirebaseToRedis() {
  const db = admin.database();
  const ref = db.ref('https://flutter-test-df9b9-default-rtdb.asia-southeast1.firebasedatabase.app/');

  ref.on('value', (snapshot) => {
    const data = snapshot.val();
    redisClient.set('your_key', JSON.stringify(data), (err) => {
      if (err) {
        console.log('Error saving to Redis:', err);
      }
    });
  });
}

// CSV로 추출하는 API
app.get('/export-csv', async (req, res) => {
  redisClient.get('your_key', (err, data) => {
    if (err) {
      return res.status(500).send('Error fetching data from Redis');
    }

    const jsonData = JSON.parse(data);
    const csvWriter = createObjectCsvWriter({
      path: 'output.csv',
      header: [
        { id: 'field1', title: 'temp1' },
        { id: 'field2', title: 'temp2' },
        { id: 'field3', title: 'temp3' },
        { id: 'field4', title: 'temp4' },
        { id: 'field5', title: 'temp5' },
        { id: 'field6', title: 'temp6' },
        { id: 'field7', title: 'temp7' },
        { id: 'field8', title: 'PH' },
        { id: 'field9', title: 'LED' },
      ],
    });

    csvWriter.writeRecords(jsonData)
      .then(() => {
        res.download('output.csv');
      })
      .catch((error) => {
        res.status(500).send('Error writing CSV file');
      });
  });
});

//이거 오류나면 서버 안되는거임
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  syncFirebaseToRedis();
});
