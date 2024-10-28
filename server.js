const express = require('express');
const redis = require('redis');
const { createObjectCsvWriter } = require('csv-writer');

// Redis 클라이언트 생성 및 연결
const redisClient = redis.createClient();

// 비동기 연결 설정
(async () => {
  await redisClient.connect(); // Redis 클라이언트 연결
  console.log('Connected to Redis');
})();

redisClient.on('error', (err) => console.log('Redis Client Error', err));

const app = express();
const port = 3000;

// JSON 데이터 파싱을 위한 미들웨어
app.use(express.json());

// Flutter로부터 데이터를 받아 Redis에 저장하는 API
app.post('/save-to-redis', async (req, res) => {
  const data = req.body; // Flutter가 보낸 JSON 데이터

  try {
    await redisClient.set('your_key', JSON.stringify(data));
    console.log('Data saved to Redis:', data);
    res.send('Data successfully saved to Redis');
  } catch (err) {
    console.log('Error saving to Redis:', err);
    res.status(500).send('Error saving data to Redis');
  }
});

// CSV로 추출하는 API
app.get('/export-csv', async (req, res) => {
  try {
    const data = await redisClient.get('your_key');
    if (!data) return res.status(500).send('Error fetching data from Redis');

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

    await csvWriter.writeRecords(jsonData);
    res.download('output.csv');
  } catch (error) {
    res.status(500).send('Error writing CSV file');
  }
});

// 서버 시작
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
