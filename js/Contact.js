export const Contact = {
    header: "", 
    body: `
        <div class="skills-wrapper">
            <section class="skills-hero">
                <div class="glitch-box">
                    <h1 class="hero-name" style="font-size: 4em;">CONTACT</h1>
                    <div class="hero-line"></div>
                </div>
            </section>

            <section class="skills-block">
                <p class="summary-para">
                    I leverage <span class="highlight">modern technologies</span> and <span class="highlight">aesthetic design</span> to transform your ideas into digital reality. Feel free to reach out through any of the channels below.
                </p>
            </section>

            <section class="skills-block">
                <div class="block-label">|| COMMUNICATION CHANNELS</div>
                <div class="matrix-grid">
                    <a href="mailto:seyidzade62@gmail.com" class="contact-link">
                        <div class="matrix-item">
                            <div class="matrix-head">01 / DIRECT MAIL</div>
                            <div class="matrix-body">
                                seyidzade62@gmail.com<br>
                                <span class="contact-subtext">For official inquiries and project proposals.</span>
                            </div>
                        </div>
                    </a>
                    
                    <a href="https://linkedin.com/in/ali-seyidzade-03020b223" target="_blank" class="contact-link">
                        <div class="matrix-item">
                            <div class="matrix-head">02 / PROFESSIONAL</div>
                            <div class="matrix-body">
                                LinkedIn / Ali Seyidzade<br>
                                <span class="contact-subtext">Professional network and detailed background.</span>
                            </div>
                        </div>
                    </a>

                    <a href="https://github.com/Khutga" target="_blank" class="contact-link">
                        <div class="matrix-item">
                            <div class="matrix-head">03 / SOURCE CODE</div>
                            <div class="matrix-body">
                                GitHub / @Khutga<br>
                                <span class="contact-subtext">Explore my repositories and coding style.</span>
                            </div>
                        </div>
                    </a>

                      <a href="https://www.instagram.com/sdz.ali/" target="_blank" class="contact-link">
                        <div class="matrix-item">
                            <div class="matrix-head">04 / SOCIAL MEDIA</div>
                            <div class="matrix-body">
                                Instagram / @sdz.ali<br>
                                <span class="contact-subtext">Follow me for updates and contact.</span>
                            </div>
                        </div>
                    </a>
                </div>
            </section>

            <section class="skills-block" style="margin-top: 50px;">
                <div class="block-label">|| SEND MESSAGE</div>
                <div class="matrix-item" style="padding: 30px; border: 1px solid rgba(0, 255, 255, 0.3);">
                    <form id="contactForm" onsubmit="return false;">
                        
                        <input type="hidden" id="recaptchaToken" name="recaptcha_token">
                        
                        <input type="text" name="_gotcha" style="display:none !important;" tabindex="-1" autocomplete="off">

                        <div style="margin-bottom: 20px;">
                            <label class="matrix-head" style="display:block; margin-bottom:5px;">IDENTITY NAME</label>
                            <input type="text" id="formName" class="cyber-input" placeholder="ENTER YOUR NAME" required>
                        </div>

                        <div style="margin-bottom: 20px;">
                            <label class="matrix-head" style="display:block; margin-bottom:5px;">EMAIL</label>
                            <input type="email" id="formEmail" class="cyber-input" placeholder="ENTER YOUR EMAIL" required>
                        </div>

                        <div style="margin-bottom: 20px;">
                            <label class="matrix-head" style="display:block; margin-bottom:5px;">MESSAGE</label>
                            <textarea id="formMessage" class="cyber-input" rows="4" placeholder="ENTER MESSAGE CONTENT" required></textarea>
                        </div>

                        <button type="submit" id="sendBtn" class="cyber-btn">
                            INITIATE TRANSMISSION
                        </button>
                        
                        <div id="formStatus" style="margin-top: 15px; font-family: monospace; font-size: 0.9rem; min-height: 20px;"></div>
                    </form>
                </div>
            </section>
            <section class="skills-footer">
                <div class="footer-col">
                    <div class="block-label">|| CURRENT LOCATION</div>
                    <div class="pill-row">
                        <span class="pill" style="border-color: #00ffff; color: #fff; background: rgba(0, 255, 255, 0.1); padding: 10px 25px; letter-spacing: 2px;">
                            📍 TÜRKİYE, BURSA, NİLÜFER
                        </span>
                    </div>
                </div>
            </section>
        </div>

        <style>
            .cyber-input {
                width: 100%;
                background: rgba(0, 0, 0, 0.4);
                border: 1px solid #333;
                color: #fff;
                padding: 12px;
                font-family: 'Segoe UI', sans-serif;
                outline: none;
                transition: 0.3s;
            }
            .cyber-input:focus {
                border-color: #00ffff;
                box-shadow: 0 0 10px rgba(0, 255, 255, 0.1);
            }
            .cyber-btn {
                background: transparent;
                border: 1px solid #00ffff;
                color: #00ffff;
                padding: 15px 30px;
                font-family: 'Courier New', monospace;
                font-weight: bold;
                cursor: pointer;
                letter-spacing: 1px;
                transition: 0.3s;
                width: 100%;
            }
            .cyber-btn:hover {
                background: rgba(0, 255, 255, 0.1);
                box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
            }
            .cyber-btn:disabled {
                border-color: #555;
                color: #555;
                cursor: not-allowed;
            }
        </style>
    `
};