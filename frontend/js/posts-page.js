/* Posts page - feed with many LinkedIn-style demo posts */
(function() {
    var user = getFullUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function getDemoPosts() {
        var name = user.name || 'User';
        var initial = name.charAt(0).toUpperCase();
        return [
            { author: name, initial: initial, headline: 'Learning in public', time: '1h', body: 'Just shipped my first feature using the roadmap from this portal. Starting with Web Dev was the right call — now diving into APIs.\n\n#WebDev #BuildInPublic', isCurrentUser: true, hasImage: false },
            { author: 'Priya Sharma', initial: 'P', headline: 'Senior Data Scientist at FinTech Co', time: '2h', body: 'Three lessons from transitioning from academia to industry:\n\n1. Ship often, even if it\'s not perfect\n2. Learn to communicate findings in one slide\n3. SQL will never go out of style\n\nWhat would you add?', isCurrentUser: false, hasImage: false },
            { author: 'Marcus Chen', initial: 'M', headline: 'Cloud Architect | AWS Community Builder', time: '3h', body: 'Spent the weekend building a small project with Lambda + API Gateway. If you\'re new to serverless, start with a single function and add complexity slowly. The free tier is generous.', isCurrentUser: false, hasImage: true },
            { author: name, initial: initial, headline: 'Aspiring developer', time: '5h', body: 'Completed the first two phases of the Web Development roadmap. HTML/CSS and JavaScript basics are done. Next: Git and then React. The step-by-step guide is super clear.', isCurrentUser: true, hasImage: false },
            { author: 'Jordan Lee', initial: 'J', headline: 'UX Designer at Startup', time: '6h', body: 'Design systems aren\'t just for big companies. Even a simple Figma library with your colors, type scale, and 10 components will 10x your consistency. Start small.', isCurrentUser: false, hasImage: false },
            { author: 'Sofia Rodriguez', initial: 'S', headline: 'Security Engineer', time: '8h', body: 'If you\'re learning cyber security: set up a home lab. One old machine or a few VMs is enough. Try HackTheBox or TryHackMe — hands-on beats theory every time.', isCurrentUser: false, hasImage: false },
            { author: 'Alex Kim', initial: 'A', headline: 'ML Engineer | Previously at FAANG', time: '10h', body: 'The best advice I got when starting in ML: get comfortable with Python, numpy, and pandas first. Then stats. Then ML algorithms. Skipping to deep learning too early slows you down.', isCurrentUser: false, hasImage: false },
            { author: 'Taylor Brown', initial: 'T', headline: 'Full-Stack Developer', time: '12h', body: 'After 2 years of tutorials I finally built something and put it online. It\'s janky. It\'s mine. Ship something small this week — you\'ll learn more than from 10 more courses.', isCurrentUser: false, hasImage: true },
            { author: name, initial: initial, headline: 'Building in public', time: '1d', body: 'Chose Data Science and Web Dev as my paths. The suggested order (Web Dev first, then Data Science) makes a lot of sense. Coding basics before data work.', isCurrentUser: true, hasImage: false },
            { author: 'Riley Nguyen', initial: 'R', headline: 'Product Manager | ex-Google', time: '1d', body: 'Product and design go hand in hand. If you\'re in PM, learn the basics of UX — user flows, wireframes, usability. You don\'t need to be a designer, but you need to speak the language.', isCurrentUser: false, hasImage: false },
            { author: 'Morgan Davis', initial: 'M', headline: 'DevOps Engineer', time: '2d', body: 'Docker in 2025: still the first thing I recommend after Git. Learn docker build, docker run, docker-compose. Then Kubernetes when you need orchestration. Don\'t start with K8s.', isCurrentUser: false, hasImage: false },
            { author: 'Casey Wu', initial: 'C', headline: 'Frontend Lead at SaaS Co', time: '2d', body: 'React vs Vue vs Svelte — pick one and go deep. The concepts transfer. I learned React first; when I tried Vue it took a weekend to feel productive. The ecosystem matters more than the framework.', isCurrentUser: false, hasImage: false },
            { author: 'Jamie Patel', initial: 'J', headline: 'Data Analyst → Data Scientist', time: '3d', body: 'My path: SQL and Excel → Python and pandas → stats and viz → ML. Took 2 years part-time. No bootcamp. This portal\'s roadmap is very close to what I wish I had from day one.', isCurrentUser: false, hasImage: false },
            { author: 'Sam Rivera', initial: 'S', headline: 'Security Researcher', time: '4d', body: 'Networking basics are non-negotiable for security. TCP/IP, DNS, HTTP — understand the stack before you try to break it. Wireshark is your friend.', isCurrentUser: false, hasImage: false },
            { author: 'Jordan Lee', initial: 'J', headline: 'UX Designer at Startup', time: '5d', body: 'Just wrapped a design sprint with engineering. Tip: invite devs to the first and last sessions. They catch feasibility issues early and buy into the solution. Collaboration > handoffs.', isCurrentUser: false, hasImage: true },
            { author: 'Blake Foster', initial: 'B', headline: 'Backend Developer | Go & Python', time: '5d', body: 'REST API design: use nouns for resources, HTTP verbs correctly, version in the URL or header from day one. And document with OpenAPI. Your future self will thank you.', isCurrentUser: false, hasImage: false },
            { author: name, initial: initial, headline: 'Aspiring developer', time: '1w', body: 'Signed up and chose my paths. The mini roadmap on the Roadmap page showing "Web Dev → Data Science" order is exactly the guidance I needed. Let\'s go!', isCurrentUser: true, hasImage: false },
            { author: 'Quinn Adams', initial: 'Q', headline: 'AI/ML Practitioner', time: '1w', body: 'Transformers changed the game. If you\'re in NLP or CV, get comfortable with Hugging Face and one of PyTorch/TF. The rest is fine-tuning and prompt engineering.', isCurrentUser: false, hasImage: false },
            { author: 'Reese Thompson', initial: 'R', headline: 'CTO at early-stage startup', time: '1w', body: 'We hire for learning ability. Show us a side project, a blog, or a roadmap you followed. Proof you can pick up new things beats a perfect resume every time.', isCurrentUser: false, hasImage: false },
            { author: 'Skyler Green', initial: 'S', headline: 'Cloud Solutions Architect', time: '1w', body: 'AWS, Azure, GCP — learn one well first. I did AWS (cert + small projects), then the others were easier. Concepts map across providers. Don\'t try to learn all three at once.', isCurrentUser: false, hasImage: false },
            { author: 'Drew Martinez', initial: 'D', headline: 'Software Engineer | Open source', time: '2w', body: 'Contributing to open source: start with docs, then "good first issue" labels. You learn the codebase, get feedback, and build a track record. No gatekeeping — just start.', isCurrentUser: false, hasImage: false },
            { author: 'Emery Wilson', initial: 'E', headline: 'Product Designer', time: '2w', body: 'Figma tip: use components and variants from day one. When the client says "make all buttons blue," you change one thing. Same idea as code components. Design systems scale.', isCurrentUser: false, hasImage: false },
            { author: 'Finley Clark', initial: 'F', headline: 'Penetration Tester', time: '2w', body: 'Ethical hacking isn\'t just tools. Understand how apps are built (web, APIs, auth). Then learn where they break. OWASP Top 10 is still the best starting list.', isCurrentUser: false, hasImage: false },
            { author: 'Hayden White', initial: 'H', headline: 'Data Engineer', time: '3w', body: 'Data engineering = moving data reliably. SQL, a scripting language (Python), and one cloud (e.g. AWS S3, Glue, Redshift). Master those before adding every new tool.', isCurrentUser: false, hasImage: false },
        ];
    }

    var feed = document.getElementById('posts-feed');
    var posts = getDemoPosts();
    var initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';

    var composer = document.createElement('div');
    composer.className = 'post-composer';
    composer.innerHTML =
        '<div class="post-composer-inner">' +
            '<div class="post-composer-avatar">' + escapeHtml(initial) + '</div>' +
            '<div class="post-composer-input-wrap">' +
                '<textarea class="post-composer-input post-composer-textarea" ' +
                    'placeholder="Share what you\\\'re building, learning, or feeling..." ' +
                    'id="post-composer-input" maxlength="1000"></textarea>' +
                '<div class="post-composer-attachment-preview" id="post-attachment-preview" hidden>' +
                    '<img id="post-attachment-image" alt="Post attachment preview">' +
                    '<button type="button" class="post-attachment-remove" id="post-attachment-remove">&times;</button>' +
                '</div>' +
                '<div class="emoji-picker" id="emoji-picker" hidden>' +
                    '<button type="button" class="emoji-btn">😀</button>' +
                    '<button type="button" class="emoji-btn">😁</button>' +
                    '<button type="button" class="emoji-btn">😂</button>' +
                    '<button type="button" class="emoji-btn">🤣</button>' +
                    '<button type="button" class="emoji-btn">😊</button>' +
                    '<button type="button" class="emoji-btn">😍</button>' +
                    '<button type="button" class="emoji-btn">😎</button>' +
                    '<button type="button" class="emoji-btn">🤩</button>' +
                    '<button type="button" class="emoji-btn">🤯</button>' +
                    '<button type="button" class="emoji-btn">🤔</button>' +
                    '<button type="button" class="emoji-btn">🙏</button>' +
                    '<button type="button" class="emoji-btn">🔥</button>' +
                    '<button type="button" class="emoji-btn">💻</button>' +
                    '<button type="button" class="emoji-btn">🚀</button>' +
                    '<button type="button" class="emoji-btn">✨</button>' +
                    '<button type="button" class="emoji-btn">🧠</button>' +
                    '<button type="button" class="emoji-btn">📚</button>' +
                    '<button type="button" class="emoji-btn">🎮</button>' +
                    '<button type="button" class="emoji-btn">🎧</button>' +
                    '<button type="button" class="emoji-btn">☕</button>' +
                '</div>' +
                '<div class="on-screen-keyboard" id="on-screen-keyboard" hidden>' +
                    '<div class="keyboard-row">' +
                        '<button type="button" class="keyboard-key" data-key="Q">Q</button>' +
                        '<button type="button" class="keyboard-key" data-key="W">W</button>' +
                        '<button type="button" class="keyboard-key" data-key="E">E</button>' +
                        '<button type="button" class="keyboard-key" data-key="R">R</button>' +
                        '<button type="button" class="keyboard-key" data-key="T">T</button>' +
                        '<button type="button" class="keyboard-key" data-key="Y">Y</button>' +
                        '<button type="button" class="keyboard-key" data-key="U">U</button>' +
                        '<button type="button" class="keyboard-key" data-key="I">I</button>' +
                        '<button type="button" class="keyboard-key" data-key="O">O</button>' +
                        '<button type="button" class="keyboard-key" data-key="P">P</button>' +
                    '</div>' +
                    '<div class="keyboard-row">' +
                        '<button type="button" class="keyboard-key" data-key="A">A</button>' +
                        '<button type="button" class="keyboard-key" data-key="S">S</button>' +
                        '<button type="button" class="keyboard-key" data-key="D">D</button>' +
                        '<button type="button" class="keyboard-key" data-key="F">F</button>' +
                        '<button type="button" class="keyboard-key" data-key="G">G</button>' +
                        '<button type="button" class="keyboard-key" data-key="H">H</button>' +
                        '<button type="button" class="keyboard-key" data-key="J">J</button>' +
                        '<button type="button" class="keyboard-key" data-key="K">K</button>' +
                        '<button type="button" class="keyboard-key" data-key="L">L</button>' +
                    '</div>' +
                    '<div class="keyboard-row">' +
                        '<button type="button" class="keyboard-key" data-key="Z">Z</button>' +
                        '<button type="button" class="keyboard-key" data-key="X">X</button>' +
                        '<button type="button" class="keyboard-key" data-key="C">C</button>' +
                        '<button type="button" class="keyboard-key" data-key="V">V</button>' +
                        '<button type="button" class="keyboard-key" data-key="B">B</button>' +
                        '<button type="button" class="keyboard-key" data-key="N">N</button>' +
                        '<button type="button" class="keyboard-key" data-key="M">M</button>' +
                        '<button type="button" class="keyboard-key wide" data-action="backspace">Backspace</button>' +
                    '</div>' +
                    '<div class="keyboard-row">' +
                        '<button type="button" class="keyboard-key wide" data-action="space">Space</button>' +
                        '<button type="button" class="keyboard-key wide" data-action="clear">Clear</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>' +
        '<div class="post-composer-actions">' +
            '<input type="file" id="post-image-input" accept="image/*" hidden>' +
            '<button type="button" class="post-composer-btn" id="post-add-photo" title="Photo / GIF">Photo / GIF</button>' +
            '<button type="button" class="post-composer-btn" id="post-toggle-emoji" title="Emoji">Emoji</button>' +
            '<button type="button" class="post-composer-btn" id="post-toggle-keyboard" title="Keyboard">Keyboard</button>' +
            '<button type="button" class="post-composer-btn post-composer-submit" id="post-composer-submit">Post</button>' +
        '</div>';
    feed.appendChild(composer);

    var submitBtn = document.getElementById('post-composer-submit');
    var inputEl = document.getElementById('post-composer-input');
    var imageInputEl = document.getElementById('post-image-input');
    var addPhotoBtn = document.getElementById('post-add-photo');
    var emojiToggleBtn = document.getElementById('post-toggle-emoji');
    var emojiPicker = document.getElementById('emoji-picker');
    var keyboardToggleBtn = document.getElementById('post-toggle-keyboard');
    var keyboardEl = document.getElementById('on-screen-keyboard');
    var attachmentPreview = document.getElementById('post-attachment-preview');
    var attachmentImage = document.getElementById('post-attachment-image');
    var attachmentRemove = document.getElementById('post-attachment-remove');
    var currentImageDataUrl = null;

    function toggleHidden(el) {
        if (!el) return;
        if (el.hasAttribute('hidden')) {
            el.removeAttribute('hidden');
        } else {
            el.setAttribute('hidden', 'true');
        }
    }

    function insertAtCursor(textarea, text) {
        if (!textarea) return;
        var start = textarea.selectionStart != null ? textarea.selectionStart : textarea.value.length;
        var end = textarea.selectionEnd != null ? textarea.selectionEnd : textarea.value.length;
        var before = textarea.value.slice(0, start);
        var after = textarea.value.slice(end);
        textarea.value = before + text + after;
        var newPos = start + text.length;
        textarea.selectionStart = textarea.selectionEnd = newPos;
        textarea.focus();
    }

    if (addPhotoBtn && imageInputEl) {
        addPhotoBtn.addEventListener('click', function() {
            imageInputEl.click();
        });

        imageInputEl.addEventListener('change', function(event) {
            var file = event.target.files && event.target.files[0];
            if (!file) {
                return;
            }
            var reader = new FileReader();
            reader.onload = function(e) {
                currentImageDataUrl = e.target.result;
                if (attachmentImage && attachmentPreview) {
                    attachmentImage.src = currentImageDataUrl;
                    attachmentPreview.removeAttribute('hidden');
                }
            };
            reader.readAsDataURL(file);
        });
    }

    if (attachmentRemove) {
        attachmentRemove.addEventListener('click', function() {
            currentImageDataUrl = null;
            if (attachmentPreview && attachmentImage) {
                attachmentImage.removeAttribute('src');
                attachmentPreview.setAttribute('hidden', 'true');
            }
            if (imageInputEl) {
                imageInputEl.value = '';
            }
        });
    }

    if (emojiToggleBtn && emojiPicker) {
        emojiToggleBtn.addEventListener('click', function() {
            toggleHidden(emojiPicker);
        });

        emojiPicker.addEventListener('click', function(event) {
            var target = event.target;
            if (target && target.classList.contains('emoji-btn')) {
                insertAtCursor(inputEl, target.textContent || '');
            }
        });
    }

    if (keyboardToggleBtn && keyboardEl) {
        keyboardToggleBtn.addEventListener('click', function() {
            toggleHidden(keyboardEl);
        });

        keyboardEl.addEventListener('click', function(event) {
            var keyEl = event.target;
            if (!keyEl || !keyEl.classList.contains('keyboard-key')) {
                return;
            }
            var action = keyEl.getAttribute('data-action');
            var key = keyEl.getAttribute('data-key');

            if (action === 'backspace') {
                if (!inputEl) return;
                inputEl.value = inputEl.value.slice(0, -1);
                inputEl.focus();
            } else if (action === 'space') {
                insertAtCursor(inputEl, ' ');
            } else if (action === 'clear') {
                if (!inputEl) return;
                inputEl.value = '';
                inputEl.focus();
            } else if (key) {
                insertAtCursor(inputEl, key);
            }
        });
    }

    if (submitBtn && inputEl) {
        submitBtn.addEventListener('click', function() {
            var text = (inputEl.value || '').trim();
            if (text) {
                inputEl.value = '';
                var newPost = {
                    author: user.name || 'You',
                    initial: initial,
                    headline: 'Building in public',
                    time: 'Just now',
                    body: text,
                    isCurrentUser: true,
                    hasImage: !!currentImageDataUrl,
                    imageDataUrl: currentImageDataUrl || null,
                };

                var card = document.createElement('div');
                card.className = 'post-card is-current-user';
                card.innerHTML = buildPostHtml(newPost);
                feed.insertBefore(card, feed.children[1]);

                currentImageDataUrl = null;
                if (attachmentPreview && attachmentImage) {
                    attachmentImage.removeAttribute('src');
                    attachmentPreview.setAttribute('hidden', 'true');
                }
                if (imageInputEl) {
                    imageInputEl.value = '';
                }
            }
        });
    }

    function buildPostHtml(post) {
        var yourBadge = post.isCurrentUser ? ' <span class="your-post-badge">· Your post</span>' : '';
        var imgHtml = '';
        if (post.imageDataUrl) {
            imgHtml =
                '<div class="post-image-wrapper">' +
                    '<img src="' + post.imageDataUrl + '" alt="Post attachment">' +
                '</div>';
        } else if (post.hasImage) {
            imgHtml = '<div class="post-image-placeholder">Image</div>';
        }
        return '<div class="post-card-header">' +
            '<div class="post-avatar">' + escapeHtml(post.initial) + '</div>' +
            '<div class="post-meta">' +
            '<div class="post-author">' + escapeHtml(post.author) + yourBadge + '</div>' +
            '<div class="post-headline">' + escapeHtml(post.headline) + '</div>' +
            '<div class="post-time">' + escapeHtml(post.time) + '</div>' +
            '</div></div>' +
            '<div class="post-body">' + escapeHtml(post.body) + '</div>' +
            imgHtml +
            '<div class="post-actions">' +
            '<button type="button" class="post-action-btn">Like</button>' +
            '<button type="button" class="post-action-btn">Comment</button>' +
            '<button type="button" class="post-action-btn">Share</button>' +
            '</div>';
    }

    posts.forEach(function(post) {
        var card = document.createElement('div');
        card.className = 'post-card' + (post.isCurrentUser ? ' is-current-user' : '');
        card.innerHTML = buildPostHtml(post);
        feed.appendChild(card);
    });
})();
