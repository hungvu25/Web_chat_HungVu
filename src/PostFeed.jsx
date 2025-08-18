import React, { useState, useEffect } from 'react';

function PostFeed({ user }) {
  const [posts, setPosts] = useState([]);
  const [likes, setLikes] = useState({});
  const [showComments, setShowComments] = useState({});
  const [comments, setComments] = useState({});
  const [commentInput, setCommentInput] = useState({});
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetch('/api/posts')
      .then(res => res.json())
      .then(data => {
        setPosts(data);
        setLoading(false);
        // Khởi tạo likes/comments/trạng thái đã like cho mỗi post từ backend
        const likeObj = {};
        const likedObj = {};
        const commentObj = {};
        const showCommentObj = {};
        const commentInputObj = {};
        data.forEach(post => {
          likeObj[post._id] = post.likes || 0;
          likedObj[post._id] = post.likedBy?.includes(user?.username) || false;
          commentObj[post._id] = post.comments || [];
          showCommentObj[post._id] = false;
          commentInputObj[post._id] = '';
        });
        setLikes(likeObj);
        setLiked(likedObj);
        setComments(commentObj);
        setShowComments(showCommentObj);
        setCommentInput(commentInputObj);
      })
      .catch(() => setLoading(false));
  }, [user]);
  const [liked, setLiked] = useState({});
  // Xử lý Like/Unlike
  const handleLike = async (postId) => {
    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user?.username })
      });
      const data = await res.json();
      setLikes(prev => ({ ...prev, [postId]: data.likes }));
      setLiked(prev => ({ ...prev, [postId]: data.liked }));
    } catch {
      setLiked(prev => ({ ...prev, [postId]: !prev[postId] }));
      setLikes(prev => ({ ...prev, [postId]: prev[postId] + (prev[postId] ? -1 : 1) }));
    }
  };

  // Xử lý hiển thị bình luận
  const toggleComments = (postId) => {
    setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  // Xử lý nhập bình luận
  const handleCommentInput = (postId, value) => {
    setCommentInput(prev => ({ ...prev, [postId]: value }));
  };

  // Xử lý gửi bình luận (đồng bộ với backend)
  const handleAddComment = async (postId) => {
    const text = commentInput[postId]?.trim();
    if (!text) return;
    try {
      const res = await fetch(`/api/posts/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: user?.username || 'Bạn', text })
      });
      const data = await res.json();
      setComments(prev => ({ ...prev, [postId]: data.comments }));
      setCommentInput(prev => ({ ...prev, [postId]: '' }));
    } catch {
      setComments(prev => ({
        ...prev,
        [postId]: [...prev[postId], { user: user?.username || 'Bạn', text }]
      }));
      setCommentInput(prev => ({ ...prev, [postId]: '' }));
    }
  };

  // Xử lý chia sẻ
  const handleShare = (postId) => {
    const url = window.location.origin + '/post/' + postId;
    navigator.clipboard.writeText(url);
    alert('Đã sao chép liên kết bài viết!');
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    setPosting(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: user?.username || 'Bạn', content: newPost })
      });
      const post = await res.json();
      if (res.ok) {
        setPosts([post, ...posts]);
        setNewPost('');
      }
    } finally {
      setPosting(false);
    }
  };

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh', width: '100vw' }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: 32, maxWidth: 1400, margin: '0 auto', padding: '32px 0' }}>
        {/* Sidebar trái */}
        <aside style={{ width: 260, minWidth: 180, background: 'none', padding: '0 0 0 12px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <img src={user?.avatar || '/logo.png'} alt="avatar" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid #007bff', background: '#eee' }} />
            <span style={{ fontWeight: 700, fontSize: 18, color: '#222' }}>{user?.firstName || user?.username || 'Chattera User'}</span>
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <a href="#" style={{ color: '#007bff', fontWeight: 600, textDecoration: 'none', fontSize: 16 }}>Bảng tin</a>
            <a href="#" style={{ color: '#222', fontWeight: 500, textDecoration: 'none', fontSize: 16 }}>Bạn bè</a>
            <a href="#" style={{ color: '#222', fontWeight: 500, textDecoration: 'none', fontSize: 16 }}>Nhóm</a>
            <a href="#" style={{ color: '#222', fontWeight: 500, textDecoration: 'none', fontSize: 16 }}>Kỷ niệm</a>
            <a href="#" style={{ color: '#222', fontWeight: 500, textDecoration: 'none', fontSize: 16 }}>Đã lưu</a>
          </nav>
        </aside>
        {/* Bảng tin giữa */}
        <main style={{ flex: 1, maxWidth: 540, minWidth: 320, height: 'calc(100vh - 120px)', overflowY: 'auto' }}>
          <div className="post-feed" style={{ maxWidth: 540, margin: '0 auto', padding: '0' }}>
            <h2 style={{ textAlign: 'center', fontWeight: 700, fontSize: 32, color: '#183153', marginBottom: 24, letterSpacing: 1 }}>Bảng tin Chattera</h2>
            <form onSubmit={handlePost} style={{ marginBottom: 32, background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <img src={user?.avatar || '/logo.png'} alt="avatar" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid #007bff', background: '#eee' }} />
                <textarea
                  value={newPost}
                  onChange={e => setNewPost(e.target.value)}
                  placeholder={user ? `${user.firstName || user.username}, bạn đang nghĩ gì?` : 'Bạn đang nghĩ gì?'}
                  rows={3}
                  style={{ flex: 1, minHeight: 60, fontSize: 17, padding: 12, borderRadius: 10, border: '1.5px solid #d0d7e2', background: '#f6f8fa', resize: 'vertical', outline: 'none', boxShadow: posting ? '0 0 0 2px #007bff33' : undefined, transition: 'box-shadow 0.2s' }}
                  disabled={posting}
                />
              </div>
              <button type="submit" disabled={posting || !newPost.trim()} style={{ alignSelf: 'flex-end', minWidth: 120, padding: '10px 0', borderRadius: 8, background: posting ? '#6cb2ff' : '#007bff', color: '#fff', border: 'none', fontWeight: 600, fontSize: 18, boxShadow: posting ? '0 2px 8px #007bff33' : '0 2px 8px #007bff22', cursor: posting ? 'not-allowed' : 'pointer', transition: 'background 0.2s, box-shadow 0.2s' }}>
                {posting ? 'Đang đăng...' : 'Đăng bài'}
              </button>
            </form>
            <div style={{ minHeight: 120 }}>
              {loading ? (
                <div style={{ textAlign: 'center', color: '#007bff', fontWeight: 500, fontSize: 18, padding: 32 }}>
                  <span className="loader" style={{ marginRight: 8, verticalAlign: 'middle' }}></span> Đang tải bài viết...
                </div>
              ) : posts.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#888', fontSize: 18, padding: 32 }}>
                  <img src="/logo.png" alt="empty" style={{ width: 60, opacity: 0.2, marginBottom: 12 }} />
                  <div>Chưa có bài viết nào.<br />Hãy là người đầu tiên chia sẻ cảm nghĩ!</div>
                </div>
              ) : (
                <>{posts.map(post => (
                  <div key={post._id} style={{ background: '#fff', borderRadius: 14, padding: 18, marginBottom: 18, boxShadow: '0 2px 12px rgba(0,0,0,0.09)', display: 'flex', gap: 14, alignItems: 'flex-start', transition: 'box-shadow 0.2s', border: '1.5px solid #f0f4fa', position: 'relative' }}>
                    <img src={post.avatar || '/logo.png'} alt="avatar" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #007bff', background: '#eee', marginTop: 2 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: '#183153', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        Chattera-style
                        <span style={{ fontWeight: 400, color: '#888', fontSize: 13, marginLeft: 8 }}>{post.author}</span>
                      </div>
                      <div style={{ margin: '8px 0 0', fontSize: 17, color: '#222', whiteSpace: 'pre-line' }}>{post.content}</div>
                      <div style={{ fontSize: 12, color: '#888', marginTop: 6 }}>{new Date(post.createdAt).toLocaleString()}</div>
                      <div style={{ display: 'flex', gap: 18, marginTop: 10 }}>
                        <button
                          style={{
                            background: liked[post._id] ? '#e6f0ff' : 'none',
                            border: 'none',
                            color: liked[post._id] ? '#007bff' : '#222',
                            fontWeight: 600,
                            fontSize: 15,
                            cursor: 'pointer',
                            padding: '4px 10px',
                            borderRadius: 6,
                            transition: 'background 0.2s'
                          }}
                          onClick={() => handleLike(post._id)}
                        >
                          👍 Thích ({likes[post._id] || 0})
                        </button>
                        <button style={{ background: 'none', border: 'none', color: '#222', fontWeight: 600, fontSize: 15, cursor: 'pointer', padding: '4px 10px', borderRadius: 6, transition: 'background 0.2s' }} onClick={() => toggleComments(post._id)}>
                          💬 Bình luận
                        </button>
                        <button style={{ background: 'none', border: 'none', color: '#222', fontWeight: 600, fontSize: 15, cursor: 'pointer', padding: '4px 10px', borderRadius: 6, transition: 'background 0.2s' }} onClick={() => handleShare(post._id)}>
                          ↗️ Chia sẻ
                        </button>
                      </div>
                      {/* Bình luận */}
                      {showComments[post._id] && (
                        <div style={{ marginTop: 16, background: '#f6f8fa', borderRadius: 10, padding: 12 }}>
                          <div style={{ fontWeight: 600, color: '#007bff', marginBottom: 8 }}>Bình luận</div>
                          <div style={{ marginBottom: 8 }}>
                            {comments[post._id]?.length === 0 ? (
                              <div style={{ color: '#888', fontSize: 15 }}>Chưa có bình luận nào.</div>
                            ) : (
                              comments[post._id].map((cmt, idx) => (
                                <div key={idx} style={{ marginBottom: 6, padding: '6px 0', borderBottom: '1px solid #e0e4ea' }}>
                                  <span style={{ fontWeight: 500, color: '#222' }}>{cmt.user}:</span> <span style={{ color: '#333' }}>{cmt.text}</span>
                                </div>
                              ))
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input
                              type="text"
                              value={commentInput[post._id] || ''}
                              onChange={e => handleCommentInput(post._id, e.target.value)}
                              placeholder="Nhập bình luận..."
                              style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #d0d7e2', fontSize: 15 }}
                            />
                            <button type="button" onClick={() => handleAddComment(post._id)} style={{ background: '#007bff', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
                              Gửi
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}</>
              )}
            </div>
            <style>{`
              @media (max-width: 900px) {
                .post-feed { max-width: 98vw !important; padding: 0 !important; }
                aside { display: none !important; }
              }
              @media (max-width: 600px) {
                .post-feed { max-width: 100vw !important; padding: 0 !important; }
              }
              .loader {
                display: inline-block;
                width: 22px;
                height: 22px;
                border: 3px solid #007bff33;
                border-top: 3px solid #007bff;
                border-radius: 50%;
                animation: spin 1s linear infinite;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        </main>
        {/* Sidebar phải */}
        <aside style={{ width: 260, minWidth: 180, background: 'none', padding: '0 12px 0 0', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: 18, fontWeight: 600, color: '#222', fontSize: 17, marginBottom: 12 }}>
            Gợi ý kết bạn
          </div>
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: 18, fontWeight: 600, color: '#222', fontSize: 17 }}>
            Quảng cáo
          </div>
        </aside>
      </div>
    </div>
  );
}

export default PostFeed;
