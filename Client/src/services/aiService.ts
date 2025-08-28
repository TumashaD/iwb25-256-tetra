import { apiCall } from "@/lib/api";

export type AIRequest = {
  competitionId?: number;
  question: string;
};

export type AIResponse = {
  answer: string;
  timestamp: string;
};

export const aiService = {
  generateResponse: async (request: AIRequest): Promise<AIResponse> => {
    const response = await apiCall("/ai/ask", {
      method: "POST",
      body: JSON.stringify(request),
    });
    console.log(response)
    return response as AIResponse;
  },
};

// Hi!  Thanks for your interest in the AR/VR Experience Builder competition.\n\nThis competition challenges participants to design and develop immersive augmented and virtual reality experiences.  The applications can be for entertainment, education, or enterprise purposes.  The competition runs from March 25th, 2024, to June 25th, 2024.  More details about submission guidelines, judging criteria, and prizes will likely be released closer to the start date.  Keep an eye out for further announcements!  Is there anything specific you'd like to know about the competition?\n

//The \"AR/VR Experience Builder\" competition offers a broad scope, allowing for diverse project ideas across entertainment, education, and enterprise. Here's a list of project ideas categorized for clarity:\n\n\n**I. Entertainment:**\n\n* **Interactive Storytelling:** Develop an AR experience where users explore a physical location overlaid with a narrative, unlocking chapters and interacting with characters based on their real-world movements.  Consider historical sites, fictional worlds, or even a mystery to solve.\n* **VR Escape Room:** Design a compelling VR escape room with intricate puzzles, atmospheric environments, and a captivating story.  Focus on unique mechanics that leverage VR's capabilities beyond traditional escape room designs.\n* **AR Game with Physical Components:** Create an AR game that blends the digital and physical world. For example, a card game where digital characters and effects enhance the gameplay on a physical tabletop.\n* **VR Music Visualization:** Develop a VR experience that visualizes music in unique and engaging ways, allowing users to interact with the visualizations and even influence the music's flow.\n* **Immersive Cinematic Experience:** Build a VR film experience that goes beyond passive viewing.  Incorporate interactive elements, choices that affect the narrative, or even allow the user to explore the environment freely.\n\n\n**II. Education:**\n\n* **AR Field Trip:** Create an AR experience that simulates a field trip to a historical location, a scientific lab, or even another planet. Users can interact with virtual objects and information, making learning more engaging.\n* **VR Anatomy Lesson:** Develop a VR application that allows users to explore the human body in 3D, examine individual organs, and learn about their functions in an interactive way.\n* **Interactive History Lesson:**  Use AR to overlay historical information onto real-world locations.  For example, users could point their phone at a historical building and see it depicted as it was centuries ago.\n* **Virtual Lab Simulation:**  Create a VR environment where students can conduct scientific experiments safely and without the need for expensive equipment.\n* **AR Language Learning:** Develop an AR app that places virtual objects labeled in the target language around the user's environment, fostering immersion and interactive learning.\n\n\n**III. Enterprise:**\n\n* **AR Training Simulator:** Design an AR training application for specific industries, such as manufacturing or healthcare, allowing users to practice procedures in a safe and controlled environment.\n* **VR Collaboration Tool:** Create a VR platform that enables remote teams to collaborate on projects in a shared virtual space, enhancing communication and interaction.\n* **AR Product Visualization:** Develop an AR application that allows customers to visualize products (furniture, appliances, etc.) in their own homes before purchasing, using augmented reality overlays.\n* **VR Safety Training:** Build a VR module to train employees on safety procedures in hazardous work environments, minimizing the risk of real-world accidents.\n* **AR Maintenance Guide:** Create an AR application that overlays instructions and diagrams onto real-world machinery, guiding technicians through repair or maintenance processes.\n\n\nRemember to consider the feasibility of your chosen project within the competition timeframe.  Focus on a well-defined scope and a clear demonstration of your AR/VR skills.  Good luck!\n