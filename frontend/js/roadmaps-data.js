/* Shared roadmap data for profile and roadmap page */
function getRoadmapsData() {
    return {
        'General': [
            { phase: '1', title: 'Set your learning goals', desc: 'Define what you want to achieve and by when.', subSteps: ['Write down 2–3 concrete outcomes', 'Choose a path from the Choose Path page'] },
            { phase: '2', title: 'Pick a path', desc: 'Select one or more paths that match your goals.', subSteps: ['Go to path-select and click a bubble', 'Your roadmap will appear in the Roadmap tab'] },
            { phase: '3', title: 'Follow the roadmap', desc: 'Work through each phase and track progress on your dashboard.', subSteps: ['Complete one phase at a time', 'Use the Dashboard to stay consistent'] },
        ],
        'Web Development': [
            { phase: '1', title: 'HTML & CSS fundamentals', desc: 'Structure and style static pages.', subSteps: ['Semantic HTML5', 'Flexbox & Grid', 'Responsive design', 'CSS variables & basics'] },
            { phase: '2', title: 'JavaScript (ES6+, DOM, async)', desc: 'Add interactivity and logic in the browser.', subSteps: ['Variables, functions, arrays, objects', 'DOM manipulation & events', 'Fetch, Promises, async/await'] },
            { phase: '3', title: 'Git & version control', desc: 'Track changes and collaborate.', subSteps: ['Commit, branch, merge', 'Remote repos (e.g. GitHub)', 'Basic workflow and PRs'] },
            { phase: '4', title: 'React or Vue.js', desc: 'Build component-based UIs.', subSteps: ['Components, state, props', 'Hooks (React) or Composition API (Vue)', 'Routing and simple state management'] },
            { phase: '5', title: 'Node.js & backend basics', desc: 'APIs and server-side logic.', subSteps: ['Express or Fastify', 'REST APIs', 'Environment variables and DB basics'] },
            { phase: '6', title: 'Build a portfolio project', desc: 'Ship one full-stack or front-end project.', subSteps: ['Design and plan', 'Build and deploy', 'Document and share'] },
        ],
        'AIML': [
            { phase: '1', title: 'Python & numpy/pandas', desc: 'Core language and data structures.', subSteps: ['Python basics and OOP', 'NumPy arrays and operations', 'Pandas for tabular data'] },
            { phase: '2', title: 'Statistics & linear algebra', desc: 'Math foundations for ML.', subSteps: ['Descriptive stats, distributions', 'Linear algebra basics', 'Probability and Bayes'] },
            { phase: '3', title: 'Machine learning fundamentals', desc: 'Classical ML before deep learning.', subSteps: ['Supervised: regression, classification', 'Unsupervised: clustering, PCA', 'Model evaluation and validation'] },
            { phase: '4', title: 'Deep learning (TensorFlow/PyTorch)', desc: 'Neural networks and training.', subSteps: ['MLPs, CNNs, RNNs', 'Training loops and optimization', 'One framework in depth'] },
            { phase: '5', title: 'NLP or Computer Vision track', desc: 'Specialize in one domain.', subSteps: ['NLP: embeddings, transformers, tasks', 'CV: object detection, segmentation', 'Projects and fine-tuning'] },
        ],
        'Data Science': [
            { phase: '1', title: 'Python & SQL', desc: 'Data access and manipulation.', subSteps: ['Python for data (pandas, etc.)', 'SQL queries and joins', 'Connecting to databases'] },
            { phase: '2', title: 'Data cleaning & EDA', desc: 'Get data ready and explore it.', subSteps: ['Handling missing values and outliers', 'Visualization (matplotlib, seaborn)', 'Summary stats and distributions'] },
            { phase: '3', title: 'Statistics & visualization', desc: 'Inference and storytelling.', subSteps: ['Hypothesis testing', 'Correlation and regression', 'Dashboards (e.g. Streamlit, Plotly)'] },
            { phase: '4', title: 'ML for prediction & clustering', desc: 'Models that add value.', subSteps: ['Regression and classification', 'Clustering and dimensionality reduction', 'Feature engineering'] },
            { phase: '5', title: 'Deployment & storytelling', desc: 'Share results and automate.', subSteps: ['Reports and presentations', 'Reproducible pipelines', 'Simple deployment or APIs'] },
        ],
        'Cyber Security': [
            { phase: '1', title: 'Networking basics', desc: 'How data moves and is addressed.', subSteps: ['TCP/IP, DNS, HTTP', 'Subnets, firewalls, VPNs', 'Wireshark and packet analysis'] },
            { phase: '2', title: 'Linux & scripting', desc: 'Operate and automate in the shell.', subSteps: ['Linux CLI and file system', 'Bash scripting', 'Permissions and services'] },
            { phase: '3', title: 'Ethical hacking fundamentals', desc: 'Offensive and defensive thinking.', subSteps: ['Recon and scanning', 'Vulnerability assessment', 'Metasploit and basic exploitation'] },
            { phase: '4', title: 'Web & app security', desc: 'Secure applications and APIs.', subSteps: ['OWASP Top 10', 'Auth and session handling', 'Secure coding practices'] },
            { phase: '5', title: 'Certifications & practice', desc: 'Validate skills and keep learning.', subSteps: ['CEH, CompTIA Security+, or similar', 'CTFs and labs', 'Bug bounties (optional)'] },
        ],
        'Cloud Computing': [
            { phase: '1', title: 'Cloud concepts (AWS/Azure/GCP)', desc: 'Core services and billing.', subSteps: ['IAM, regions, availability', 'Billing and cost control', 'One provider in depth first'] },
            { phase: '2', title: 'Compute & storage', desc: 'Run workloads and store data.', subSteps: ['EC2 / VMs and scaling', 'S3 / object storage', 'Databases (RDS, NoSQL options)'] },
            { phase: '3', title: 'Networking & security in cloud', desc: 'VPCs and secure access.', subSteps: ['VPC, subnets, security groups', 'Load balancers and CDN', 'Encryption and compliance basics'] },
            { phase: '4', title: 'Containers & Kubernetes', desc: 'Containers and orchestration.', subSteps: ['Docker build and run', 'Kubernetes concepts and kubectl', 'Deploy a simple app'] },
            { phase: '5', title: 'Serverless & DevOps', desc: 'Events and automation.', subSteps: ['Lambdas / serverless functions', 'CI/CD pipelines', 'Infrastructure as Code (e.g. Terraform)'] },
        ],
        'Product & Design': [
            { phase: '1', title: 'UX research & user flows', desc: 'Understand users and journeys.', subSteps: ['Interviews and surveys', 'Personas and journey maps', 'Problem definition'] },
            { phase: '2', title: 'Wireframing & prototyping', desc: 'Ideate and test structure.', subSteps: ['Low-fidelity wireframes', 'Prototyping tools', 'Usability testing basics'] },
            { phase: '3', title: 'UI design (Figma)', desc: 'Visual design and components.', subSteps: ['Figma fundamentals', 'Typography, color, layout', 'Components and variants'] },
            { phase: '4', title: 'Design systems', desc: 'Scale and consistency.', subSteps: ['Tokens and components', 'Documentation', 'Handoff to dev'] },
            { phase: '5', title: 'Handoff & collaboration', desc: 'Work with engineering and stakeholders.', subSteps: ['Specs and annotations', 'Design reviews', 'Iteration and feedback loops'] },
        ],
    };
}

/* Recommended order for learning (foundations first, then specialization) */
function getRecommendedPathOrder() {
    return ['Web Development', 'Data Science', 'AIML', 'Cloud Computing', 'Cyber Security', 'Product & Design'];
}
