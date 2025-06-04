import React, { useEffect, useState } from 'react';

interface YouTubeVideo {
  id: { videoId: string };
  snippet: {
    title: string;
    thumbnails: { medium: { url: string } };
    channelTitle: string;
  };
}

interface YouTubeResultsProps {
  query: string;
}

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

const YouTubeResults: React.FC<YouTubeResultsProps> = ({ query }) => {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) return;
    if (!API_KEY) {
      setError('YouTube API key is missing. Please set VITE_YOUTUBE_API_KEY in your .env file.');
      setVideos([]);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
        query
      )}&type=video&maxResults=5&key=${API_KEY}`
    )
      .then((res) => res.json())
      .then((data) => {
        console.log('YouTube API response:', data);
        if (data.error) {
          setError(data.error.message || 'YouTube API error.');
          setVideos([]);
        } else if (data.items && data.items.length > 0) {
          setVideos(data.items);
        } else {
          setError('No videos found.');
          setVideos([]);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch YouTube videos.');
        setVideos([]);
        setLoading(false);
      });
  }, [query]);

  if (!query) return null;

  return (
    <div className="youtube-results">
      <h3>Watch How-To Videos</h3>
      {loading && <p>Loading videos...</p>}
      {error && <p className="error-message">{error}</p>}
      {!loading && !error && videos.length === 0 && (
        <p>No videos found.</p>
      )}
      <div className="youtube-videos-grid">
        {videos.map((video) => (
          <a
            key={video.id.videoId}
            href={`https://www.youtube.com/watch?v=${video.id.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="youtube-video-link"
          >
            <img
              src={video.snippet.thumbnails.medium.url}
              alt={video.snippet.title}
              className="youtube-thumbnail"
            />
            <div className="youtube-title">{video.snippet.title}</div>
            <div className="youtube-channel">{video.snippet.channelTitle}</div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default YouTubeResults; 