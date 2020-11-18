const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.static("public"))

function duplicateChecker(blogPosts) {
  const duplicateCheck = new Set();
  const blogPostsCleaned = [];

  for (const post of blogPosts) {
    if (!duplicateCheck.has(post.id)) {
      duplicateCheck.add(post.id);
      blogPostsCleaned.push(post);
    }
  }

  return blogPostsCleaned;
}
// --------------------GETS--------------------- //
app.get('/', (req, res) => {
  res.redirect('/api/posts');
});

app.get('/api/ping', (req, res) => {
  res.status(200).json({ success: true });
});

app.get('/api/posts', (req, res) => {
  let sortBy = null;
  let direction = 'asc';

  /// ////////// Error handling ///////////////
  // Tags error
  if (!req.param('tags')) {
    res.status(400).json({ error: 'Tags parameter is required' });
  }
  // directions error
  if (req.param('direction')) {
    if (req.param('direction').toLowerCase() !== 'asc' && req.param('direction').toLowerCase() !== 'desc') {
      res.status(400).json({ error: 'direction parameter is invalid' });
    }
    direction = req.param('direction').toLowerCase();
  }
  // sortBy error
  if (!req.param('sortBy')) {
    sortBy = 'id';
  } else {
    sortBy = req.param('sortBy').toLowerCase();
  }
  if (sortBy !== 'id' && sortBy !== 'reads' && sortBy !== 'likes' && sortBy !== 'popularity') {
    res.status(400).json({ error: 'sortBy parameter is invalid' });
  }

  // Concurrent API calls
  const tags = req.param('tags').toLowerCase(); const tagsArr = tags.split(',');

  const promises = tagsArr
    .map((tag) => axios.get(`https://hatchways.io/api/assessment/blog/posts?tag=${tag}`));

  Promise.all(promises)
    .then((data) => {
      // Concatanating the data
      let blogPosts = [];
      for (let i = 0; i < data.length; i++) {
        blogPosts = blogPosts.concat(data[i].data.posts);
      }
      // Duplicate blog posts check
      const blogPostsCleaned = duplicateChecker(blogPosts);
      // Sorting the blog posts
      if (direction === 'desc') {
        blogPostsCleaned.sort((b, a) => parseFloat(a[sortBy]) - parseFloat(b[sortBy]));
      }

      if (direction === 'asc') {
        blogPostsCleaned.sort((a, b) => parseFloat(a[sortBy]) - parseFloat(b[sortBy]));
      }

      // Rendering final results
      res.json({ posts: blogPostsCleaned });
    });
});


app.listen(process.env.PORT || 3000, 
	() => console.log("Server is running on port 3000"));
