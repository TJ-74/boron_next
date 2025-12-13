/**
 * Resume Content Generator
 * Generates realistic project and experience details for autonomous AI mode
 */

export interface GeneratedProject {
  title: string;
  startDate: string;
  endDate: string;
  technologies: string;
  highlights: string[];
}

export interface GeneratedExperience {
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  highlights: string[];
}

/**
 * Infer technologies from project title/keywords
 */
export function inferProjectTechnologies(title: string): string[] {
  const lowerTitle = title.toLowerCase();
  
  const techMap: Record<string, string[]> = {
    'weather': ['Python', 'OpenWeatherAPI', 'Flask', 'JavaScript', 'REST API'],
    'bot': ['Python', 'Natural Language Processing', 'API Integration', 'Machine Learning'],
    'chatbot': ['Python', 'NLP', 'TensorFlow', 'DialogFlow', 'REST API'],
    'ai': ['Machine Learning', 'TensorFlow', 'Python', 'Neural Networks', 'Deep Learning'],
    'ml': ['Python', 'scikit-learn', 'pandas', 'numpy', 'Machine Learning'],
    'web': ['React', 'Node.js', 'MongoDB', 'REST API', 'TypeScript'],
    'website': ['React', 'Next.js', 'Tailwind CSS', 'TypeScript', 'Vercel'],
    'mobile': ['React Native', 'TypeScript', 'Firebase', 'Redux', 'Expo'],
    'app': ['React', 'TypeScript', 'REST API', 'MongoDB', 'Node.js'],
    'data': ['Python', 'SQL', 'pandas', 'Data Visualization', 'NumPy'],
    'analytics': ['Python', 'SQL', 'Tableau', 'Data Analysis', 'Statistics'],
    'blockchain': ['Solidity', 'Web3.js', 'Ethereum', 'Smart Contracts', 'Hardhat'],
    'game': ['Unity', 'C#', 'Game Physics', '3D Modeling', 'Animation'],
    'ecommerce': ['React', 'Node.js', 'Stripe', 'MongoDB', 'Payment Integration'],
    'dashboard': ['React', 'D3.js', 'Chart.js', 'REST API', 'Data Visualization'],
    'api': ['Node.js', 'Express', 'REST API', 'MongoDB', 'Authentication'],
    'backend': ['Node.js', 'Express', 'PostgreSQL', 'REST API', 'Docker'],
    'frontend': ['React', 'TypeScript', 'Tailwind CSS', 'Redux', 'Responsive Design'],
    'fullstack': ['React', 'Node.js', 'MongoDB', 'REST API', 'TypeScript'],
    'ios': ['Swift', 'SwiftUI', 'Core Data', 'UIKit', 'Xcode'],
    'android': ['Kotlin', 'Jetpack Compose', 'Room Database', 'MVVM', 'Android Studio'],
    'devops': ['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Jenkins'],
    'cloud': ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'Microservices'],
    'security': ['Cybersecurity', 'Penetration Testing', 'Encryption', 'OAuth', 'Security Auditing'],
    'iot': ['Arduino', 'Raspberry Pi', 'MQTT', 'Sensors', 'Embedded Systems'],
    'recommendation': ['Machine Learning', 'Collaborative Filtering', 'Python', 'TensorFlow', 'Content-Based Filtering'],
    'detection': ['Computer Vision', 'CNN', 'TensorFlow', 'OpenCV', 'Deep Learning'],
    'classification': ['Machine Learning', 'Classification Algorithms', 'Python', 'scikit-learn', 'Feature Engineering'],
    'prediction': ['Machine Learning', 'Regression', 'Time Series', 'Python', 'Statistical Modeling'],
    'nlp': ['Natural Language Processing', 'BERT', 'Transformers', 'Python', 'spaCy'],
    'image': ['Computer Vision', 'CNN', 'TensorFlow', 'Image Processing', 'OpenCV'],
    'voice': ['Speech Recognition', 'Audio Processing', 'Python', 'Deep Learning', 'Signal Processing'],
  };

  // Find matching technologies
  for (const [keyword, techList] of Object.entries(techMap)) {
    if (lowerTitle.includes(keyword)) {
      return techList.slice(0, 4); // Return top 4 technologies
    }
  }
  
  // Default tech stack if no match
  return ['Python', 'JavaScript', 'REST API', 'Git'];
}

/**
 * Infer tech stack from job role and company
 */
export function inferExperienceTechnologies(title: string, company?: string): string[] {
  const lowerTitle = title.toLowerCase();
  const lowerCompany = company?.toLowerCase() || '';
  
  // Company-specific tech stacks
  if (lowerCompany.includes('microsoft')) {
    return ['C#', '.NET', 'Azure', 'TypeScript', 'SQL Server'];
  }
  if (lowerCompany.includes('google')) {
    return ['Go', 'Python', 'GCP', 'Kubernetes', 'TensorFlow'];
  }
  if (lowerCompany.includes('amazon') || lowerCompany.includes('aws')) {
    return ['AWS', 'Java', 'Python', 'DynamoDB', 'Lambda'];
  }
  if (lowerCompany.includes('meta') || lowerCompany.includes('facebook')) {
    return ['React', 'Python', 'GraphQL', 'PyTorch', 'Hack'];
  }
  if (lowerCompany.includes('apple')) {
    return ['Swift', 'Objective-C', 'iOS', 'macOS', 'Xcode'];
  }
  
  // Role-based tech stacks
  const roleMap: Record<string, string[]> = {
    'software engineer': ['Python', 'JavaScript', 'React', 'Node.js', 'Git'],
    'frontend': ['React', 'TypeScript', 'HTML/CSS', 'Redux', 'Webpack'],
    'backend': ['Node.js', 'Python', 'PostgreSQL', 'REST API', 'Docker'],
    'fullstack': ['React', 'Node.js', 'MongoDB', 'TypeScript', 'REST API'],
    'data scientist': ['Python', 'pandas', 'Machine Learning', 'SQL', 'TensorFlow'],
    'data analyst': ['SQL', 'Python', 'Tableau', 'Excel', 'Data Visualization'],
    'data engineer': ['Python', 'Spark', 'Airflow', 'SQL', 'ETL'],
    'ml engineer': ['Python', 'TensorFlow', 'PyTorch', 'MLOps', 'Docker'],
    'devops': ['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Terraform'],
    'cloud': ['AWS', 'Azure', 'GCP', 'Terraform', 'Kubernetes'],
    'mobile': ['React Native', 'Swift', 'Kotlin', 'Firebase', 'REST API'],
    'ios': ['Swift', 'SwiftUI', 'UIKit', 'Core Data', 'Xcode'],
    'android': ['Kotlin', 'Jetpack Compose', 'MVVM', 'Room', 'Retrofit'],
    'qa': ['Selenium', 'Jest', 'Cypress', 'Test Automation', 'Python'],
    'security': ['Cybersecurity', 'Penetration Testing', 'OWASP', 'Security Auditing', 'Encryption'],
    'product manager': ['Agile', 'Scrum', 'JIRA', 'Product Strategy', 'Stakeholder Management'],
    'designer': ['Figma', 'Adobe XD', 'UI/UX Design', 'Prototyping', 'User Research'],
  };

  for (const [keyword, techList] of Object.entries(roleMap)) {
    if (lowerTitle.includes(keyword)) {
      return techList;
    }
  }
  
  // Default
  return ['Python', 'JavaScript', 'Git', 'Agile', 'Problem Solving'];
}

/**
 * Generate realistic date ranges
 */
export function generateRealisticDateRange(
  duration: 'short' | 'medium' | 'long' = 'medium'
): { startDate: string; endDate: string } {
  const now = new Date();
  const endDate = new Date(now);
  
  // Randomize end date (0-3 months ago, or present)
  const monthsAgo = Math.random() < 0.3 ? 0 : Math.floor(Math.random() * 3);
  endDate.setMonth(endDate.getMonth() - monthsAgo);
  
  const startDate = new Date(endDate);
  
  // Set duration
  const durationMonths = {
    'short': 2 + Math.floor(Math.random() * 4), // 2-6 months
    'medium': 4 + Math.floor(Math.random() * 8), // 4-12 months
    'long': 12 + Math.floor(Math.random() * 24), // 12-36 months
  };
  
  startDate.setMonth(startDate.getMonth() - durationMonths[duration]);
  
  const formatDate = (d: Date) => 
    `${d.toLocaleString('en', { month: 'short' })} ${d.getFullYear()}`;
  
  return {
    startDate: formatDate(startDate),
    endDate: monthsAgo === 0 ? 'Present' : formatDate(endDate)
  };
}

/**
 * Generate realistic metrics
 */
export function generateRealisticMetrics() {
  return {
    accuracy: Math.floor(Math.random() * 20 + 75), // 75-95%
    improvement: Math.floor(Math.random() * 30 + 15), // 15-45%
    reduction: Math.floor(Math.random() * 35 + 20), // 20-55%
    users: Math.floor(Math.random() * 900 + 100), // 100-1000
    scale: Math.floor(Math.random() * 9000 + 1000), // 1000-10000
  };
}

/**
 * Generate project highlights based on type
 */
export function generateProjectHighlights(
  title: string,
  technologies: string[]
): string[] {
  const metrics = generateRealisticMetrics();
  const lowerTitle = title.toLowerCase();
  
  const highlights: string[] = [];
  
  // Type-specific highlights
  if (lowerTitle.includes('ml') || lowerTitle.includes('ai') || lowerTitle.includes('detection') || lowerTitle.includes('classification')) {
    highlights.push(
      `Achieved **${metrics.accuracy}% accuracy** in ${title.toLowerCase()} using **${technologies[0]}** and **${technologies[1]}**.`,
      `Implemented **${technologies[2] || 'advanced algorithms'}** for model optimization, improving prediction performance by **${metrics.improvement}%**.`,
      `Processed and analyzed **${metrics.scale}+ data samples** to train and validate the model.`
    );
  } else if (lowerTitle.includes('web') || lowerTitle.includes('app') || lowerTitle.includes('platform')) {
    highlights.push(
      `Developed a full-stack application using **${technologies[0]}** and **${technologies[1]}**, serving **${metrics.users}+ active users**.`,
      `Implemented **${technologies[2] || 'REST API'}** for seamless data integration, reducing load time by **${metrics.improvement}%**.`,
      `Deployed on **${technologies[3] || 'cloud platform'}** with **CI/CD pipeline**, ensuring **99.9% uptime**.`
    );
  } else if (lowerTitle.includes('bot') || lowerTitle.includes('chat')) {
    highlights.push(
      `Built an intelligent bot using **${technologies[0]}** and **${technologies[1]}**, handling **${metrics.users}+ queries daily**.`,
      `Integrated **${technologies[2] || 'NLP'}** capabilities, improving response accuracy by **${metrics.improvement}%**.`,
      `Reduced response time by **${metrics.reduction}%** through optimization and caching strategies.`
    );
  } else if (lowerTitle.includes('data') || lowerTitle.includes('analytics')) {
    highlights.push(
      `Analyzed **${metrics.scale}+ records** using **${technologies[0]}** and **${technologies[1]}** to extract actionable insights.`,
      `Created interactive dashboards with **${technologies[2] || 'visualization tools'}**, improving decision-making efficiency by **${metrics.improvement}%**.`,
      `Automated data processing pipelines, reducing manual effort by **${metrics.reduction}%**.`
    );
  } else {
    // Generic highlights
    highlights.push(
      `Developed a comprehensive solution using **${technologies[0]}** and **${technologies[1]}**, achieving **${metrics.accuracy}% success rate**.`,
      `Implemented key features with **${technologies[2] || 'modern technologies'}**, improving performance by **${metrics.improvement}%**.`,
      `Successfully deployed and maintained the project, serving **${metrics.users}+ users** with high reliability.`
    );
  }
  
  return highlights.slice(0, 3); // Return 3 highlights
}

/**
 * Generate experience highlights based on role
 */
export function generateExperienceHighlights(
  title: string,
  company: string,
  technologies: string[]
): string[] {
  const metrics = generateRealisticMetrics();
  const lowerTitle = title.toLowerCase();
  
  const highlights: string[] = [];
  
  if (lowerTitle.includes('software engineer') || lowerTitle.includes('developer')) {
    highlights.push(
      `Developed and maintained **full-stack applications** using **${technologies[0]}**, **${technologies[1]}**, and **${technologies[2]}**, improving system performance by **${metrics.improvement}%**.`,
      `Collaborated with cross-functional teams to design and implement **${technologies[3] || 'scalable solutions'}**, serving **${metrics.users}+ users** daily.`,
      `Reduced technical debt by **${metrics.reduction}%** through code refactoring and implementing best practices.`,
      `Mentored **${Math.floor(Math.random() * 3 + 2)} junior developers**, fostering a culture of continuous learning and code quality.`
    );
  } else if (lowerTitle.includes('data scientist') || lowerTitle.includes('ml engineer')) {
    highlights.push(
      `Built and deployed **machine learning models** using **${technologies[0]}** and **${technologies[1]}**, achieving **${metrics.accuracy}% accuracy**.`,
      `Analyzed **${metrics.scale}+ data points** to extract insights, driving business decisions that increased revenue by **${metrics.improvement}%**.`,
      `Optimized data pipelines with **${technologies[2] || 'modern tools'}**, reducing processing time by **${metrics.reduction}%**.`,
      `Presented findings to stakeholders, influencing product strategy and feature prioritization.`
    );
  } else if (lowerTitle.includes('product manager')) {
    highlights.push(
      `Led product development for **${Math.floor(Math.random() * 3 + 2)} key features**, increasing user engagement by **${metrics.improvement}%**.`,
      `Managed cross-functional teams of **${Math.floor(Math.random() * 8 + 5)} members**, delivering projects **${Math.floor(Math.random() * 15 + 10)}% ahead of schedule**.`,
      `Conducted market research and user interviews with **${metrics.users}+ participants**, informing product roadmap decisions.`,
      `Increased product adoption by **${metrics.improvement}%** through strategic feature prioritization and stakeholder alignment.`
    );
  } else if (lowerTitle.includes('frontend')) {
    highlights.push(
      `Developed responsive web applications using **${technologies[0]}** and **${technologies[1]}**, improving user experience and accessibility.`,
      `Optimized frontend performance, reducing page load time by **${metrics.reduction}%** and increasing conversion rates by **${metrics.improvement}%**.`,
      `Implemented **${technologies[2] || 'modern UI patterns'}** and component libraries, accelerating development velocity by **${metrics.improvement}%**.`,
      `Collaborated with designers to create pixel-perfect implementations, serving **${metrics.users}+ daily active users**.`
    );
  } else if (lowerTitle.includes('backend')) {
    highlights.push(
      `Designed and implemented **RESTful APIs** using **${technologies[0]}** and **${technologies[1]}**, handling **${metrics.scale}+ requests daily**.`,
      `Optimized database queries and indexing with **${technologies[2] || 'SQL'}**, reducing response time by **${metrics.reduction}%**.`,
      `Built scalable microservices architecture with **${technologies[3] || 'Docker'}**, improving system reliability to **99.9% uptime**.`,
      `Implemented caching strategies, reducing server load by **${metrics.improvement}%** and improving API performance.`
    );
  } else {
    // Generic highlights for any role
    highlights.push(
      `Contributed to key projects using **${technologies[0]}** and **${technologies[1]}**, delivering high-quality solutions on time.`,
      `Improved team efficiency by **${metrics.improvement}%** through process optimization and automation.`,
      `Collaborated with **${Math.floor(Math.random() * 8 + 5)} team members** to achieve project goals and meet deadlines.`,
      `Reduced operational costs by **${metrics.reduction}%** through strategic improvements and best practices.`
    );
  }
  
  return highlights.slice(0, 4); // Return 4 highlights
}

/**
 * Generate a complete project with realistic details
 */
export function generateProject(
  title: string,
  options?: {
    duration?: 'short' | 'medium' | 'long';
    projectType?: string;
  }
): GeneratedProject {
  const technologies = inferProjectTechnologies(title);
  const dates = generateRealisticDateRange(options?.duration || 'medium');
  const highlights = generateProjectHighlights(title, technologies);
  
  return {
    title,
    startDate: dates.startDate,
    endDate: dates.endDate,
    technologies: technologies.join(', '),
    highlights
  };
}

/**
 * Generate a complete experience with realistic details
 */
export function generateExperience(
  title: string,
  company: string,
  options?: {
    duration?: 'short' | 'medium' | 'long';
    location?: string;
  }
): GeneratedExperience {
  const technologies = inferExperienceTechnologies(title, company);
  const dates = generateRealisticDateRange(options?.duration || 'long');
  const highlights = generateExperienceHighlights(title, company, technologies);
  
  return {
    title,
    company,
    location: options?.location || '',
    startDate: dates.startDate,
    endDate: dates.endDate,
    highlights
  };
}

