const request = require('supertest');
const app = require('../server');

describe('SoundWave API Integration Tests', () => {
  let token;
  let testUser = {
    email: 'test@example.com',
    password: 'password123',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User'
  };

  describe('Auth Endpoints', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toEqual(testUser.email);
      expect(res.body.token).toBeDefined();
    });

    it('should fail to register a user with duplicate email/username', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      expect(res.statusCode).toEqual(409);
      expect(res.body.success).toBe(false);
    });

    it('should login the user and return a token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      token = res.body.token; // Save token for subsequent requests
    });

    it('should fail login with incorrect credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Songs Endpoints', () => {
    it('should get list of songs', async () => {
      const res = await request(app).get('/api/v1/songs');
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].coverArt).toBeDefined();
      expect(res.body.data[0].duration).toBeDefined();
    });

    it('should get single song details', async () => {
      const res = await request(app).get('/api/v1/songs/1');
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toEqual('Midnight Dreams');
    });

    it('should return 404 for non-existent song ID', async () => {
      const res = await request(app).get('/api/v1/songs/999');
      expect(res.statusCode).toEqual(404);
    });

    it('should redirect to actual audioUrl on stream request', async () => {
      const res = await request(app).get('/api/v1/songs/1/stream');
      expect(res.statusCode).toEqual(302);
      expect(res.headers.location).toEqual('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
    });

    it('should download song and return audio url', async () => {
      const res = await request(app)
        .post('/api/v1/songs/1/download')
        .send({ quality: '320' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.downloadUrl).toEqual('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
    });
  });

  describe('Playlists Endpoints', () => {
    it('should deny access to get/create playlists without token', async () => {
      const res1 = await request(app).get('/api/v1/playlists');
      expect(res1.statusCode).toEqual(401);

      const res2 = await request(app)
        .post('/api/v1/playlists')
        .send({ name: 'My Playlist' });
      expect(res2.statusCode).toEqual(401);
    });

    it('should create a playlist when authorized', async () => {
      const res = await request(app)
        .post('/api/v1/playlists')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Chill Vibez', description: 'Study mood' });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toEqual('Chill Vibez');
      expect(res.body.data.songs).toBeDefined();
    });

    it('should retrieve playlists for logged-in user', async () => {
      const res = await request(app)
        .get('/api/v1/playlists')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].name).toEqual('Chill Vibez');
    });
  });

  describe('Search Endpoint', () => {
    it('should search songs and artists and return full attributes', async () => {
      const res = await request(app).get('/api/v1/search?q=Midnight');
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.songs).toBeDefined();
      expect(res.body.data.songs[0].coverArt).toBeDefined();
      expect(res.body.data.songs[0].duration).toBeDefined();
    });
  });
});
