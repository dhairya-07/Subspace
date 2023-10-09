const app = require('express')();
const _ = require('lodash');
const axios = require('axios');
const fs = require('fs');

// ----- WITHOUT CACHING -------
// const analyseData = async (req, res, next) => {
//   try {
//     const url = `https://intent-kit-16.hasura.app/api/rest/blogs`;
//     const headers = {
//       'x-hasura-admin-secret':
//         '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6',
//     };
//     const response = await axios.get(url, { headers: headers });

//     const data = await response.data.blogs;

//     const longestTitleBlog = _.reduce(
//       data,
//       (acc, curr) => (acc && acc.title.length > curr.title.length ? acc : curr),
//       { title: '' }
//     );

//     const blogsWithPrivacy = _.filter(data, (blog) =>
//       blog.title.includes('Privacy')
//     );

//     const uniqueTitles = _.chain(data)
//       .uniqBy((blog) => blog.title)
//       .map((blog) => blog.title);

//     const analytics = {
//       total: data.length,
//       longestTitleBlog: longestTitleBlog,
//       titlesContainingPrivacy: blogsWithPrivacy,
//       uniques: uniqueTitles,
//     };

//     res.locals.analytics = analytics;
//   } catch (err) {
//     console.error(err);
//   }
//   next();
// };

// app.get('/api/blog-stats', analyseData, async (req, res) => {
//   return res.status(200).json({
//     data: {
//       analytics: res.locals.analytics,
//     },
//   });
// });

// ------ WITH CACHING -------
async function fetchData() {
  try {
    const url = `https://intent-kit-16.hasura.app/api/rest/blogs`;
    const headers = {
      'x-hasura-admin-secret':
        '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6',
    };
    const response = await axios.get(url, { headers: headers });

    const data = await response.data.blogs;
    return data;
  } catch (err) {
    console.error(err);
  }
}

function analyseData(data) {
  const longestTitleBlog = _.reduce(
    data,
    (acc, curr) => (acc && acc.title.length > curr.title.length ? acc : curr),
    { title: '' }
  );

  const blogsWithPrivacy = _.filter(data, (blog) =>
    blog.title.includes('Privacy')
  );

  const uniqueTitles = _.chain(data)
    .uniqBy((blog) => blog.title)
    .map((blog) => blog.title);

  return {
    total: data.length,
    longestTitleBlog: longestTitleBlog,
    titlesContainingPrivacy: blogsWithPrivacy.length,
    uniques: uniqueTitles,
  };
}

app.get('/api/blog-stats', async (req, res) => {
  const memoizeAnaltyicsData = _.memoize(analyseData);
  try {
    const data = await fetchData();
    var analytics = memoizeAnaltyicsData(data);
  } catch (err) {
    console.error(err);
  }

  return res.status(200).json({
    data: {
      analytics: analytics,
    },
  });
});

app.get('/api/blog-search', async (req, res) => {
  const { query } = req.query;
  try {
    const data = await fetchData();

    const regex = new RegExp(query, 'gi');
    const filtered = _.filter(data, (blog) => blog.title.match(regex));
    return res.status(200).json({
      msg: 'Successful',
      data: {
        filteredResult: filtered,
      },
    });
  } catch (err) {
    console.error(err);
  }
});

app.listen(4001, () => {
  console.log('Server running on port 4001');
});
