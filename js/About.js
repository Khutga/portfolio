export const About = {
    header: "ABOUT ME",
    body: `
    <style>
        .about-container {
            padding: 20px;
        }

        .about-profile-card {
            display: flex;
            gap: 40px;
            padding: 35px;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(0, 255, 255, 0.02) 100%);
            border: 1px solid rgba(0, 255, 255, 0.15);
            border-radius: 16px;
            margin-bottom: 40px;
            backdrop-filter: blur(15px);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            align-items: flex-start;
        }

        .profile-img-wrapper {
            flex-shrink: 0;
            width: 160px;
            height: 160px;
            position: relative;
            padding: 5px;
            border: 1px dashed rgba(0, 255, 255, 0.3);
            border-radius: 50%; 
        }

        .profile-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 50%;
            filter: grayscale(10%) contrast(1.1);
            transition: all 0.5s ease;
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.1);
        }

        .profile-img-wrapper:hover .profile-img {
            filter: grayscale(0%) contrast(1);
            transform: scale(1.05) rotate(3deg);
            box-shadow: 0 0 30px rgba(0, 255, 255, 0.4);
        }

        .about-content {
            flex-grow: 1;
        }

        .about-text {
            font-size: 1rem;
            line-height: 1.7;
            color: #d0d0d0;
            margin-bottom: 15px;
        }

        .tech-stack-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
            gap: 12px; 
            margin-top: 30px;
        }

        .tech-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 10px 5px; 
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
            cursor: default;
            height: 100%;
        }

        .tech-item:hover {
            background: rgba(0, 255, 255, 0.05);
            border-color: rgba(0, 255, 255, 0.3);
            transform: translateY(-5px);
            box-shadow: 0 5px 20px rgba(0, 255, 255, 0.1);
        }

        .tech-icon {
            width: 38px;
            height: 38px;
            margin-bottom: 8px;
            object-fit: contain;
            filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.5)); 
            transition: all 0.3s ease;
        }
        
        .tech-icon[src$=".jpg"], .tech-icon[src$=".jpeg"] {
            border-radius: 10px;
            mix-blend-mode: normal; 
        }

        .tech-item:hover .tech-icon {
            transform: scale(1.15);
            filter: drop-shadow(0 0 8px rgba(0, 255, 255, 0.8)) brightness(1.2);
        }

        .tech-name {
            font-family: 'Courier New', monospace;
            font-size: 0.7rem;
            color: #aaa;
            text-transform: uppercase;
            letter-spacing: 1px;
            text-align: center;
        }

        @media (max-width: 768px) {
            .about-profile-card {
                flex-direction: column;
                align-items: center;
                text-align: center;
            }
        }
    </style>

    <div class="skills-wrapper about-container">
        
        <section class="skills-hero">
            <div class="glitch-box">
                <h1 class="hero-name">ALİ SEYİDZADE</h1>
                <div class="hero-line"></div>
            </div>
        </section>

        <div class="about-profile-card">
            <div class="profile-img-wrapper">
                <img src="./assets/profile.jpg" alt="Ali Seyidzade" class="profile-img" onerror="this.src='./assets/cfd.png'">
            </div>
            
            <div class="about-content">
                <div class="block-label" style="margin-top:0">|| WHO AM I?</div>
                <p class="about-text">
                    I am <span class="highlight">Ali Seyidzade</span>. As a passionate and fast-learning <span class="highlight">Full-Stack Developer</span>, I specialize in creating high-performance, feature-rich applications using <span class="highlight">Dart</span> and <span class="highlight">Flutter</span>.
                </p>
                <p class="about-text">
                    I have developed solutions featuring <span class="highlight">real-time map services</span>, secure communication, and payment processing, designed with driver, customer, and admin interfaces for a seamless user experience. I also deliver smooth video content with advanced controls and subscription management.
                </p>
                <p class="about-text">
                    In all my projects, I focus on <span class="highlight">intuitive UI/UX design</span> and robust backend services to ensure optimized performance. I’m fluent in English, Azerbaijani, Turkish, and have basic knowledge of Russian.
                </p>
            </div>
        </div>

        <section class="skills-block">
            <div class="block-label">|| TECHNOLOGY ARSENAL</div>
            <div class="tech-stack-grid">
                
                <div class="tech-item">
                    <img src="./assets/logos/flutter.svg" alt="Flutter" class="tech-icon">
                    <span class="tech-name">Flutter</span>
                </div>

                <div class="tech-item">
                    <img src="./assets/logos/dart.png" alt="Dart" class="tech-icon">
                    <span class="tech-name">Dart</span>
                </div>

                <div class="tech-item">
                    <img src="./assets/logos/react.png" alt="React" class="tech-icon">
                    <span class="tech-name">React</span>
                </div>

                <div class="tech-item">
                    <img src="./assets/logos/threejs.png" alt="Three.js" class="tech-icon">
                    <span class="tech-name">Three.js</span>
                </div>

                <div class="tech-item">
                    <img src="./assets/logos/node.svg" alt="Node.js" class="tech-icon">
                    <span class="tech-name">Node.js</span>
                </div>

                <div class="tech-item">
                    <img src="./assets/logos/sql.png" alt="SQL" class="tech-icon">
                    <span class="tech-name">SQL</span>
                </div>

                <div class="tech-item">
                    <img src="./assets/logos/firebase.svg" alt="Firebase" class="tech-icon">
                    <span class="tech-name">Firebase</span>
                </div>

                <div class="tech-item">
                    <img src="./assets/logos/ios.svg" alt="iOS" class="tech-icon">
                    <span class="tech-name">iOS</span>
                </div>

                <div class="tech-item">
                    <img src="./assets/logos/cross.png" alt="Cross-Platform" class="tech-icon">
                    <span class="tech-name">Cross-Platform</span>
                </div>

                <div class="tech-item">
                    <img src="./assets/logos/figma.svg" alt="Figma" class="tech-icon">
                    <span class="tech-name">Figma</span>
                </div>

                <div class="tech-item">
                    <img src="./assets/logos/realtime.png" alt="Real-Time" class="tech-icon">
                    <span class="tech-name">Real-Time</span>
                </div>

                <div class="tech-item">
                    <img src="./assets/logos/android.png" alt="Android" class="tech-icon">
                    <span class="tech-name">Android</span>
                </div>

                <div class="tech-item">
                    <img src="./assets/logos/adobe.png" alt="Adobe" class="tech-icon">
                    <span class="tech-name">Adobe</span>
                </div>

            </div>
        </section>
    </div>
    `
};