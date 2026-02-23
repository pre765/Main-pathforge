const ROADMAPS = {
  "AI/ML": {
    beginner: {
      skills: ["Python Basics", "Math for ML"],
      resources: ["Intro to ML Course", "Linear Algebra Playlist"],
      projects: ["Iris Classifier"]
    },
    intermediate: {
      skills: ["Scikit-learn", "Feature Engineering"],
      resources: ["Model Evaluation Tutorial"],
      projects: ["House Price Predictor"]
    },
    advanced: {
      skills: ["Deep Learning", "Model Deployment"],
      resources: ["MLOps Crash Course"],
      projects: ["Image Classifier API"]
    }
  },
  Cybersecurity: {
    beginner: {
      skills: ["Networking Basics", "Linux Fundamentals"],
      resources: ["CompTIA Security+ Intro"],
      projects: ["Home Lab Setup"]
    },
    intermediate: {
      skills: ["Web Security", "Threat Modeling"],
      resources: ["OWASP Top 10 Guide"],
      projects: ["Vulnerability Assessment"]
    },
    advanced: {
      skills: ["Penetration Testing", "Incident Response"],
      resources: ["Blue Team Handbook"],
      projects: ["CTF Writeups Portfolio"]
    }
  },
  "Web Development": {
    beginner: {
      skills: ["HTML", "CSS", "JavaScript"],
      resources: ["Frontend Basics Playlist"],
      projects: ["Personal Portfolio"]
    },
    intermediate: {
      skills: ["React", "Node.js", "REST APIs"],
      resources: ["Fullstack Course"],
      projects: ["Task Manager App"]
    },
    advanced: {
      skills: ["System Design", "Testing", "DevOps Basics"],
      resources: ["Scalable Web Apps Guide"],
      projects: ["Production-ready SaaS MVP"]
    }
  },
  "Data Science": {
    beginner: {
      skills: ["Python", "Statistics", "Data Cleaning"],
      resources: ["Pandas Tutorial"],
      projects: ["Data Analysis Notebook"]
    },
    intermediate: {
      skills: ["Visualization", "SQL", "A/B Testing"],
      resources: ["SQL for Analysts"],
      projects: ["Business Dashboard"]
    },
    advanced: {
      skills: ["Time Series", "Experimentation", "Storytelling"],
      resources: ["Advanced Analytics Course"],
      projects: ["Forecasting Project"]
    }
  }
};

const buildRoadmapItems = (roadmap) => {
  const items = [];
  const stages = ["beginner", "intermediate", "advanced"];

  stages.forEach((stage) => {
    const section = roadmap[stage];
    ["skills", "resources", "projects"].forEach((type) => {
      section[type].forEach((label, index) => {
        items.push({
          id: `${stage}:${type}:${index}`,
          stage,
          type,
          label
        });
      });
    });
  });

  return items;
};

module.exports = {
  ROADMAPS,
  buildRoadmapItems
};
