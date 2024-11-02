const express = require('express');
const redis = require('redis');
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');

const app = express();
const port = 3000;

// Redis 클라이언트 생성 및 연결
const redisClient = redis.createClient();

(async () => {
  try {
    await redisClient.connect();
    console.log('Connected to Redis');
  } catch (error) {
    console.error('Redis connection error:', error);
  }
})();

redisClient.on('error', (err) => console.error('Redis Client Error', err));

// JSON 데이터 파싱 미들웨어
app.use(express.json());

// 1. Flutter 웹 정적 파일 제공
app.use(express.static(path.join(__dirname, 'build/web')));

// 기본 경로로 접속 시 Flutter 웹 애플리케이션의 index.html 반환
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'build/web', 'index.html'));
});

// 나머지 API 설정은 동일

// ESP32 데이터 저장 API
app.post('/esp-data', async (req, res) => {
  const data = req.body;

  try {
    await redisClient.set('latest_data', JSON.stringify(data));
    console.log('Data saved to Redis from ESP32:', data);
    res.json({ message: 'Data successfully saved to Redis from ESP32', data });
  } catch (err) {
    console.error('Error saving data from ESP32 to Redis:', err);
    res.status(500).json({ error: 'Error saving data from ESP32 to Redis' });
  }
});

// Flutter로부터 데이터를 받아 Redis에 저장하는 API
app.post('/save-to-redis', async (req, res) => {
  const data = req.body;

  try {
    await redisClient.set('your_key', JSON.stringify(data));
    console.log('Data saved to Redis from Flutter:', data);
    res.json({ message: 'Data successfully saved to Redis from Flutter', data });
  } catch (err) {
    console.error('Error saving data from Flutter to Redis:', err);
    res.status(500).json({ error: 'Error saving data from Flutter to Redis' });
  }
});

// CSV로 추출하는 API
app.get('/export-csv', async (req, res) => {
  try {
    const data = await redisClient.get('your_key');
    if (!data) {
      return res.status(404).json({ error: 'No data found in Redis for key: your_key' });
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

    await csvWriter.writeRecords(Array.isArray(jsonData) ? jsonData : [jsonData]);

    res.download(path.join(__dirname, 'output.csv'), 'output.csv', (err) => {
      if (err) {
        console.error('Error downloading CSV file:', err);
        res.status(500).json({ error: 'Error downloading CSV file' });
      }
    });
  } catch (error) {
    console.error('Error writing CSV file:', error);
    res.status(500).json({ error: 'Error writing CSV file' });
  }
});

// 서버 시작
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
