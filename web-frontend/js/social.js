/* ==========================================================================
   INSTAGRAM-STYLE SOCIAL MEDIA CONTROLLER (SoundWave Social Hub)
   ========================================================================== */

class InstagramSocialController {
  constructor() {
    this.stories = [
      { id: 1, username: 'your_story', name: 'Your Story', avatar: 'assets/about_headphones.jpg', seen: false, media: 'assets/hero_concert.jpg', track: 'SoundWave Anthem' },
      { id: 2, username: 'badshah', name: 'Badshah', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150', seen: false, media: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800', track: 'Soulmate (feat. Arijit Singh)' },
      { id: 3, username: 'diljit', name: 'Diljit Dosanjh', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', seen: false, media: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800', track: 'Naina (Crew Soundtrack)' },
      { id: 4, username: 'yo_yo', name: 'Yo Yo Honey Singh', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', seen: true, media: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800', track: 'Payal (Glory Album)' },
      { id: 5, username: 'karan_aujla', name: 'Karan Aujla', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150', seen: false, media: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800', track: 'Tauba Tauba' }
    ];

    this.feedPosts = [
      {
        id: 101,
        username: 'badshah',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
        location: 'Mumbai, India • Studio Session 🎙️',
        media: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
        likes: 124890,
        liked: false,
        saved: false,
        caption: 'Cooking up the next viral SoundWave track with the squad! Who is ready? 🔥🎧',
        comments: [
          { user: 'arijit_fan', text: 'Waiting eagerly for this banger! 🔥' },
          { user: 'soundwave_official', text: 'Exclusive 320kbps Master stream dropping soon on SoundWave!' }
        ],
        time: '2 HOURS AGO'
      },
      {
        id: 102,
        username: 'diljit',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        location: 'Vancouver, Canada • Arena Tour',
        media: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800',
        likes: 98450,
        liked: true,
        saved: true,
        caption: 'Vancouver arena vibe was unmatched last night! Stream the live album exclusively on SoundWave 🎵✨',
        comments: [
          { user: 'karan_aujla', text: 'Paji solid vibe! 🚀' }
        ],
        time: '5 HOURS AGO'
      }
    ];

    this.reels = [
      {
        id: 201,
        username: 'badshah',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
        caption: 'Soulmate live studio recording session 🎹 #SoundWaveExclusive',
        track: 'Soulmate - Badshah & Arijit Singh',
        likes: '45.2K',
        comments: '1.2K',
        media: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800'
      },
      {
        id: 202,
        username: 'yo_yo',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        caption: 'Payal beat drop breakdown! 🔊 #GloryAlbum #SoundWave',
        track: 'Payal - Yo Yo Honey Singh',
        likes: '89.1K',
        comments: '3.4K',
        media: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800'
      }
    ];

    this.dmThreads = [
      {
        id: 301,
        name: 'Badshah',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
        lastMsg: 'Yo! Did you check out the new 320kbps master track?',
        time: '12m',
        messages: [
          { sender: 'them', text: 'Hey MusicVibe team! Thanks for putting "Soulmate" on top trending!' },
          { sender: 'me', text: 'Glad to have you on SoundWave! The fans are loving it 🔥' },
          { sender: 'them', text: 'Yo! Did you check out the new 320kbps master track?' }
        ]
      },
      {
        id: 302,
        name: 'Diljit Dosanjh',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        lastMsg: 'Arena tour live concert audio ready for upload 🎤',
        time: '1h',
        messages: [
          { sender: 'them', text: 'Sat Shri Akal! Arena tour live concert audio ready for upload 🎤' }
        ]
      }
    ];

    this.currentDmThreadId = 301;
    this.initSocialUI();
  }

  initSocialUI() {
    this.renderStoriesRail();
    this.renderFeedPosts();
    this.renderReelsFeed();
    this.renderDmInbox();
    this.setupSocialEventListeners();
  }

  setupSocialEventListeners() {
    // DM Send Action
    document.getElementById('dmSendBtn')?.addEventListener('click', () => this.sendDmMessage());
    document.getElementById('dmInputField')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendDmMessage();
    });

    // Story Modal Close Action
    document.getElementById('closeStoryModalBtn')?.addEventListener('click', () => {
      const storyModal = document.getElementById('storyViewerModal');
      if (storyModal) storyModal.style.display = 'none';
    });
  }

  renderStoriesRail() {
    const container = document.getElementById('storiesRail');
    if (!container) return;

    container.innerHTML = this.stories.map(story => `
      <div class="story-item ${story.seen ? 'seen' : ''}" onclick="window.SocialApp.openStoryModal(${story.id})">
        <div class="story-avatar-wrap">
          <img src="${story.avatar}" alt="${story.name}" class="story-avatar-img">
        </div>
        <span class="story-username">${story.name}</span>
      </div>
    `).join('');
  }

  openStoryModal(storyId) {
    const story = this.stories.find(s => s.id === storyId);
    if (!story) return;

    story.seen = true;
    this.renderStoriesRail();

    const storyModal = document.getElementById('storyViewerModal');
    const storyImg = document.getElementById('storyViewerImg');
    const storyName = document.getElementById('storyViewerName');
    const storyTrack = document.getElementById('storyViewerTrack');

    if (storyImg) storyImg.src = story.media;
    if (storyName) storyName.textContent = story.name;
    if (storyTrack) storyTrack.textContent = `🎵 ${story.track}`;
    if (storyModal) storyModal.style.display = 'flex';
  }

  renderFeedPosts() {
    const container = document.getElementById('igFeedContainer');
    if (!container) return;

    container.innerHTML = this.feedPosts.map(post => `
      <div class="ig-post-card" id="post-${post.id}">
        <div class="ig-post-header">
          <div class="ig-post-user">
            <img src="${post.avatar}" alt="${post.username}" class="ig-post-avatar">
            <div>
              <div class="ig-post-username">
                ${post.username} <span style="color:#60a5fa; font-size:0.85rem;">✔</span>
              </div>
              <div class="ig-post-location">${post.location}</div>
            </div>
          </div>
          <span style="color:rgba(255,255,255,0.6); cursor:pointer;">•••</span>
        </div>

        <div class="ig-post-media-wrap" ondblclick="window.SocialApp.toggleLikePost(${post.id})">
          <img src="${post.media}" alt="Post media" class="ig-post-media">
          <div class="heart-explosion" id="heart-anim-${post.id}">❤️</div>
        </div>

        <div class="ig-post-actions">
          <div class="ig-action-left">
            <button class="ig-action-btn ${post.liked ? 'liked' : ''}" onclick="window.SocialApp.toggleLikePost(${post.id})">
              ${post.liked ? '❤️' : '🤍'}
            </button>
            <button class="ig-action-btn" onclick="window.SocialApp.openComments(${post.id})">💬</button>
            <button class="ig-action-btn" onclick="window.SocialApp.sharePost(${post.id})">✈️</button>
          </div>
          <button class="ig-action-btn ${post.saved ? 'saved' : ''}" onclick="window.SocialApp.toggleSavePost(${post.id})">
            ${post.saved ? '🏷️' : '🔖'}
          </button>
        </div>

        <div class="ig-post-meta">
          <div class="ig-likes-count">${post.likes.toLocaleString()} likes</div>
          <div class="ig-caption"><strong>${post.username}</strong>${post.caption}</div>
          <button class="ig-view-comments-btn" onclick="window.SocialApp.openComments(${post.id})">
            View all ${post.comments.length} comments
          </button>
          <div class="ig-post-time">${post.time}</div>
        </div>
      </div>
    `).join('');
  }

  toggleLikePost(postId) {
    const post = this.feedPosts.find(p => p.id === postId);
    if (!post) return;

    post.liked = !post.liked;
    post.likes += post.liked ? 1 : -1;

    // Trigger double tap heart animation
    const anim = document.getElementById(`heart-anim-${postId}`);
    if (anim) {
      anim.classList.remove('active');
      void anim.offsetWidth; // Trigger reflow
      anim.classList.add('active');
    }

    this.renderFeedPosts();
  }

  toggleSavePost(postId) {
    const post = this.feedPosts.find(p => p.id === postId);
    if (!post) return;

    post.saved = !post.saved;
    this.renderFeedPosts();
    const app = window.app || (typeof app !== 'undefined' ? app : null);
    if (app) app.showNotification(post.saved ? 'Post saved to collection 🔖' : 'Post removed from saved');
  }

  openComments(postId) {
    const app = window.app || (typeof app !== 'undefined' ? app : null);
    if (app) app.showNotification('Comment drawer opened 💬', 'info');
  }

  sharePost(postId) {
    const app = window.app || (typeof app !== 'undefined' ? app : null);
    if (app) app.showNotification('Post link copied to clipboard ✈️', 'success');
  }

  renderReelsFeed() {
    const container = document.getElementById('reelsContainer');
    if (!container) return;

    container.innerHTML = this.reels.map(reel => `
      <div class="reel-card">
        <img src="${reel.media}" alt="Reel media" class="reel-media">
        <div class="reel-overlay-content">
          <div class="reel-info">
            <div class="reel-user-row">
              <img src="${reel.avatar}" alt="${reel.username}" class="reel-avatar">
              <span style="font-weight:700; color:#fff;">${reel.username}</span>
              <button class="reel-follow-btn">Follow</button>
            </div>
            <div class="reel-caption">${reel.caption}</div>
            <div class="reel-music-track">🎵 ${reel.track}</div>
          </div>

          <div class="reel-actions-column">
            <div class="reel-action-item"><span>❤️</span> ${reel.likes}</div>
            <div class="reel-action-item"><span>💬</span> ${reel.comments}</div>
            <div class="reel-action-item"><span>✈️</span> Share</div>
          </div>
        </div>
      </div>
    `).join('');
  }

  renderDmInbox() {
    const list = document.getElementById('dmThreadsList');
    if (!list) return;

    list.innerHTML = this.dmThreads.map(thread => `
      <div class="dm-thread-item ${thread.id === this.currentDmThreadId ? 'active' : ''}" onclick="window.SocialApp.selectDmThread(${thread.id})">
        <img src="${thread.avatar}" alt="${thread.name}" class="dm-thread-avatar">
        <div class="dm-thread-info">
          <div class="dm-thread-name">${thread.name}</div>
          <div class="dm-thread-lastmsg">${thread.lastMsg}</div>
        </div>
      </div>
    `).join('');

    this.renderDmMessages();
  }

  selectDmThread(threadId) {
    this.currentDmThreadId = threadId;
    this.renderDmInbox();
  }

  renderDmMessages() {
    const stream = document.getElementById('dmMessagesStream');
    const headerName = document.getElementById('dmChatHeaderName');
    const thread = this.dmThreads.find(t => t.id === this.currentDmThreadId);
    if (!stream || !thread) return;

    if (headerName) headerName.textContent = thread.name;

    stream.innerHTML = thread.messages.map(msg => `
      <div class="dm-bubble ${msg.sender === 'me' ? 'outgoing' : 'incoming'}">
        ${msg.text}
      </div>
    `).join('');

    stream.scrollTop = stream.scrollHeight;
  }

  sendDmMessage() {
    const input = document.getElementById('dmInputField');
    if (!input || !input.value.trim()) return;

    const text = input.value.trim();
    input.value = '';

    const thread = this.dmThreads.find(t => t.id === this.currentDmThreadId);
    if (!thread) return;

    thread.messages.push({ sender: 'me', text });
    thread.lastMsg = text;

    this.renderDmInbox();
  }
}

// Initialize Instagram Social Controller instance on load
window.addEventListener('DOMContentLoaded', () => {
  window.SocialApp = new InstagramSocialController();
});
