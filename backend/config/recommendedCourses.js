const RECOMMENDED_COURSES = {
  "Web Development": [
    {
      id: "web-odin-project",
      title: "The Odin Project",
      provider: "The Odin Project",
      url: "https://www.theodinproject.com/",
      isFree: true
    },
    {
      id: "web-cs50-web",
      title: "CS50's Web Programming with Python and JavaScript",
      provider: "Harvard CS50",
      url: "https://cs50.harvard.edu/web/",
      isFree: true
    },
    {
      id: "web-mdn-learn",
      title: "MDN Web Docs: Learn Web Development",
      provider: "MDN",
      url: "https://developer.mozilla.org/en-US/docs/Learn",
      isFree: true
    }
  ],
  "AI/ML": [
    {
      id: "aiml-google-mlcc",
      title: "Google Machine Learning Crash Course",
      provider: "Google",
      url: "https://developers.google.com/machine-learning/crash-course",
      isFree: true
    },
    {
      id: "aiml-fastai",
      title: "Practical Deep Learning for Coders",
      provider: "fast.ai",
      url: "https://course.fast.ai/",
      isFree: true
    }
  ],
  "Data Science": [
    {
      id: "ds-mit-ocw-60002",
      title: "MIT OCW: Introduction to Computational Thinking and Data Science",
      provider: "MIT OpenCourseWare",
      url: "https://ocw.mit.edu/courses/6-0002-introduction-to-computational-thinking-and-data-science-fall-2016/",
      isFree: true
    },
    {
      id: "ds-data8",
      title: "Data 8: Foundations of Data Science",
      provider: "UC Berkeley",
      url: "https://www.data8.org/",
      isFree: true
    }
  ],
  Cybersecurity: [
    {
      id: "cyber-portswigger",
      title: "PortSwigger Web Security Academy",
      provider: "PortSwigger",
      url: "https://portswigger.net/web-security",
      isFree: true
    },
    {
      id: "cyber-cisco-intro",
      title: "Cisco Networking Academy: Introduction to Cybersecurity",
      provider: "Cisco Networking Academy",
      url: "https://www.cisco.com/site/us/en/learn/training-certifications/courses/intro-cybersecurity.html",
      isFree: true
    }
  ]
};

const getCourseIndex = () => {
  const index = new Map();
  Object.entries(RECOMMENDED_COURSES).forEach(([domain, courses]) => {
    courses.forEach((course) => {
      index.set(course.id, { ...course, domain });
    });
  });
  return index;
};

module.exports = {
  RECOMMENDED_COURSES,
  getCourseIndex
};
