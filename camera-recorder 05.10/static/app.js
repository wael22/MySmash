class CameraRecorder {
    constructor() {
        this.sessionId = null;
        this.websocket = null;
        this.selectedDuration = 7200;
        this.isRecording = false;
        this._mjpegLoopId = null;
        this._stabilizedImg = null;
        
        this.canvas = document.getElementById('preview-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.initializeEventListeners();
        this.loadVideos();
    }

    initializeEventListeners() {
        document.getElementById('btn-open-session').addEventListener('click', () => this.openSession());
        document.getElementById('btn-close-session').addEventListener('click', () => this.closeSession());
        document.getElementById('btn-start-recording').addEventListener('click', () => this.startRecording());
        document.getElementById('btn-stop-recording').addEventListener('click', () => this.stopRecording());
        document.getElementById('btn-refresh-videos').addEventListener('click', () => this.loadVideos());

        document.querySelectorAll('.btn-duration').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.btn-duration').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.selectedDuration = parseInt(e.target.dataset.duration);
            });
        });
    }

    async openSession() {
        const url = document.getElementById('camera-url').value.trim();
        if (!url) {
            alert('Veuillez entrer une URL de caméra');
            return;
        }

        try {
            this.updateStatus('Ouverture de la session...');
            
            const response = await fetch('/session/open', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Erreur lors de l\'ouverture de la session');
            }

            const data = await response.json();
            this.sessionId = data.session_id;

            this.updateSessionInfo(data);
            // If source is MJPEG, create a hidden Image element and start rendering
            // it to the preview canvas when frames arrive. This is more reliable
            // than depending on the inline DOM <img> timing.
            try {
                if (data.source_type && data.source_type.toLowerCase() === 'mjpeg' && data.source_url) {
                    // Remove any previous hidden img
                    const prev = document.getElementById('__hidden_stabilized_img');
                    if (prev) prev.remove();

                    const hid = new Image();
                    hid.id = '__hidden_stabilized_img';
                    // do not set crossOrigin unless you need to call toDataURL
                    hid.style.display = 'none';
                    hid.src = data.source_url;
                    hid.onload = () => {
                        this._stabilizedImg = hid;
                        this.startMjpegRender();
                    };
                    hid.onerror = () => {
                        console.warn('Failed to load stabilized MJPEG image');
                    };
                    document.body.appendChild(hid);
                }
            } catch (e) {
                console.warn('Error wiring stabilized MJPEG image:', e);
            }
            this.updateStatus('Session ouverte, connexion à la prévisualisation...');

            this.connectWebSocket();

            document.getElementById('btn-open-session').disabled = true;
            document.getElementById('btn-close-session').disabled = false;
            document.getElementById('btn-start-recording').disabled = false;

        } catch (error) {
            console.error('Erreur:', error);
            alert(`Erreur: ${error.message}`);
            this.updateStatus('Erreur lors de l\'ouverture');
        }
    }

    async closeSession() {
        if (!this.sessionId) return;

        try {
            if (this.isRecording) {
                await this.stopRecording();
            }

            if (this.websocket) {
                this.websocket.close();
                this.websocket = null;
            }

            // stop any MJPEG render loop
            this.stopMjpegRender();
            const prev = document.getElementById('__hidden_stabilized_img');
            if (prev) prev.remove();

            const response = await fetch('/session/close', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: this.sessionId })
            });

            this.sessionId = null;
            this.updateStatus('Session fermée');
            this.updateSessionInfo(null);
            this.clearCanvas();

            document.getElementById('btn-open-session').disabled = false;
            document.getElementById('btn-close-session').disabled = true;
            document.getElementById('btn-start-recording').disabled = true;
            document.getElementById('btn-stop-recording').disabled = true;

        } catch (error) {
            console.error('Erreur:', error);
            alert(`Erreur lors de la fermeture: ${error.message}`);
        }
    }

    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/stream?session_id=${this.sessionId}`;

        this.websocket = new WebSocket(wsUrl);

        this.websocket.onopen = () => {
            console.log('WebSocket connecté');
            this.updateStatus('Prévisualisation active');
            document.getElementById('preview-status').style.display = 'none';
        };

        this.websocket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                
                if (message.error) {
                    console.error('Erreur WebSocket:', message.error);
                    this.updateStatus(`Erreur: ${message.error}`);
                    return;
                }

                if (message.type === 'frame' && message.data) {
                    this.displayFrame(message.data, message.frame_number);
                }
            } catch (error) {
                console.error('Erreur traitement message:', error);
            }
        };

        this.websocket.onerror = (error) => {
            console.error('Erreur WebSocket:', error);
            this.updateStatus('Erreur de connexion WebSocket');
        };

        this.websocket.onclose = () => {
            console.log('WebSocket fermé');
            if (this.sessionId) {
                this.updateStatus('Prévisualisation déconnectée');
            }
            document.getElementById('preview-status').style.display = 'block';
            document.getElementById('preview-status').textContent = 'Déconnecté';
        };
    }

    displayFrame(base64Data, frameNumber) {
        const img = new Image();
        img.onload = () => {
            if (this.canvas.width !== img.width || this.canvas.height !== img.height) {
                this.canvas.width = img.width;
                this.canvas.height = img.height;
            }
            this.ctx.drawImage(img, 0, 0);
            
            if (frameNumber % 30 === 0) {
                document.getElementById('preview-info').textContent = 
                    `Frame: ${frameNumber} | Résolution: ${img.width}x${img.height}`;
            }
        };
        img.src = 'data:image/jpeg;base64,' + base64Data;
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        document.getElementById('preview-status').style.display = 'block';
        document.getElementById('preview-status').textContent = 'En attente...';
        document.getElementById('preview-info').textContent = '';
    }

    async startRecording() {
        if (!this.sessionId || this.isRecording) return;

        try {
            const response = await fetch('/record/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: this.sessionId,
                    duration_seconds: this.selectedDuration
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Erreur lors du démarrage de l\'enregistrement');
            }

            const data = await response.json();
            this.isRecording = true;

            document.getElementById('btn-start-recording').disabled = true;
            document.getElementById('btn-stop-recording').disabled = false;

            const minutes = Math.floor(this.selectedDuration / 60);
            document.getElementById('recording-status').textContent = 
                `⏺ Enregistrement en cours... (durée: ${minutes} min)`;
            document.getElementById('recording-status').style.color = '#dc3545';
            document.getElementById('recording-status').style.fontWeight = 'bold';

            setTimeout(() => {
                this.checkRecordingStatus();
            }, this.selectedDuration * 1000);

        } catch (error) {
            console.error('Erreur:', error);
            alert(`Erreur: ${error.message}`);
        }
    }

    async stopRecording() {
        if (!this.sessionId || !this.isRecording) return;

        try {
            const response = await fetch('/record/stop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: this.sessionId })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Erreur lors de l\'arrêt de l\'enregistrement');
            }

            this.isRecording = false;

            document.getElementById('btn-start-recording').disabled = false;
            document.getElementById('btn-stop-recording').disabled = true;

            document.getElementById('recording-status').textContent = 
                '⏹ Enregistrement arrêté';
            document.getElementById('recording-status').style.color = '#6c757d';

            setTimeout(() => this.loadVideos(), 1000);

        } catch (error) {
            console.error('Erreur:', error);
            alert(`Erreur: ${error.message}`);
        }
    }

    async checkRecordingStatus() {
        if (!this.sessionId) return;

        try {
            const response = await fetch(`/record/status/${this.sessionId}`);
            const status = await response.json();

            if (!status.recording && this.isRecording) {
                this.isRecording = false;
                document.getElementById('btn-start-recording').disabled = false;
                document.getElementById('btn-stop-recording').disabled = true;
                document.getElementById('recording-status').textContent = 
                    '✓ Enregistrement terminé';
                document.getElementById('recording-status').style.color = '#28a745';
                this.loadVideos();
            }
        } catch (error) {
            console.error('Erreur vérification statut:', error);
        }
    }

    async loadVideos() {
        try {
            const response = await fetch('/videos');
            const data = await response.json();

            const videosList = document.getElementById('videos-list');
            videosList.innerHTML = '';

            if (data.videos.length === 0) {
                videosList.innerHTML = '<p style="padding: 20px; text-align: center; color: #666;">Aucune vidéo enregistrée</p>';
                return;
            }

            data.videos.forEach(video => {
                const videoItem = document.createElement('div');
                videoItem.className = 'video-item';

                const sizeInMB = (video.size / (1024 * 1024)).toFixed(2);
                const createdDate = new Date(video.created).toLocaleString('fr-FR');

                videoItem.innerHTML = `
                    <h4>${video.filename}</h4>
                    <p><strong>Taille:</strong> ${sizeInMB} MB</p>
                    <p><strong>Créé:</strong> ${createdDate}</p>
                    <div class="video-item-actions">
                        <button class="btn btn-primary" onclick="app.playVideo('${video.filename}')">
                            ▶ Lire
                        </button>
                        <a href="/videos/${video.filename}" download class="btn btn-secondary" style="text-decoration: none; display: inline-block;">
                            ⬇ Télécharger
                        </a>
                    </div>
                `;

                videosList.appendChild(videoItem);
            });

        } catch (error) {
            console.error('Erreur chargement vidéos:', error);
        }
    }

    playVideo(filename) {
        const player = document.getElementById('video-player');
        player.src = `/videos/${filename}`;
        player.play();
        player.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    updateStatus(message) {
        console.log('Status:', message);
    }

    updateSessionInfo(data) {
        const infoBox = document.getElementById('session-info');
        
        if (!data) {
            infoBox.innerHTML = '<p>Aucune session active</p>';
            return;
        }

        // Show stabilized/proxied stream info. For MJPEG sources render the MJPEG inline
        // so the user can visually confirm the stabilized stream in the UI.
        const created = new Date(data.created_at).toLocaleTimeString('fr-FR');
        const localUrl = data.local_rtsp_url || '';
        const srcUrl = data.source_url || '';

        let html = '';
        html += `<p><strong>Session ID:</strong> ${data.session_id}</p>`;
        html += `<p><strong>Type:</strong> ${data.source_type.toUpperCase()}</p>`;
    html += `<p><strong>URL locale (proxy):</strong> <span style=\"display:flex;align-items:center;gap:8px;\"><a href=\"${localUrl}\" target=\"_blank\">${localUrl}</a> <button class=\"btn btn-secondary\" style=\"padding:6px 8px;\" id=\"copy_local_rtsp\">Copier</button> <button class=\"btn btn-primary\" style=\"padding:6px 8px;\" id=\"open_vlc\">Ouvrir VLC</button> <span id=\"proxy_badge\" style=\"margin-left:6px;font-weight:700;color:#666;\">${data.verified ? 'Ready' : 'Not Ready'}</span></span></p>`;
        html += `<p><strong>Source originale:</strong> <a href="${srcUrl}" target="_blank">${srcUrl}</a></p>`;
        html += `<p><strong>Créée:</strong> ${created}</p>`;

        // If source is MJPEG, show an inline <img> that points to the MJPEG source so the browser
        // can render the live stream (low latency). If it's RTSP we rely on the websocket preview.
        if (data.source_type && data.source_type.toLowerCase() === 'mjpeg' && srcUrl) {
            html += `<div style="margin-top:8px;"><strong>Flux stabilisé (MJPEG):</strong><br /><img id=\"stabilized-img\" src=\"${srcUrl}\" alt=\"MJPEG\" style=\"max-width:100%;margin-top:8px;border-radius:6px;\" /></div>`;
        }

        infoBox.innerHTML = html;

        // hook copy button
        const copyBtn = document.getElementById('copy_local_rtsp');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(localUrl).then(() => {
                    copyBtn.textContent = 'Copié';
                    setTimeout(() => copyBtn.textContent = 'Copier', 2000);
                }).catch(() => alert('Impossible de copier'));
            });
        }

        const openVlcBtn = document.getElementById('open_vlc');
        if (openVlcBtn) {
            openVlcBtn.addEventListener('click', async () => {
                try {
                    const resp = await fetch('/open/vlc', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ session_id: data.session_id })
                    });
                    if (!resp.ok) {
                        const err = await resp.json();
                        throw new Error(err.detail || 'Erreur launching VLC');
                    }
                    openVlcBtn.textContent = 'Lancé';
                    setTimeout(() => openVlcBtn.textContent = 'Ouvrir VLC', 2000);
                } catch (e) {
                    alert('Erreur: ' + e.message);
                }
            });
        }

        // If MJPEG, wire the stabilized <img> into the preview canvas so the
        // existing preview canvas shows the stabilized stream as well.
        if (data.source_type && data.source_type.toLowerCase() === 'mjpeg' && srcUrl) {
            const imgEl = document.getElementById('stabilized-img');
            if (imgEl) {
                this._stabilizedImg = imgEl;
                this.startMjpegRender();
            }
        } else {
            this.stopMjpegRender();
        }
    }

    startMjpegRender() {
        if (!this._stabilizedImg) return;
        const img = this._stabilizedImg;
        const draw = () => {
            try {
                if (img.naturalWidth && img.naturalHeight) {
                    if (this.canvas.width !== img.naturalWidth || this.canvas.height !== img.naturalHeight) {
                        this.canvas.width = img.naturalWidth;
                        this.canvas.height = img.naturalHeight;
                    }
                    this.ctx.drawImage(img, 0, 0);
                }
            } catch (e) {
                // ignore draw errors
            }
            this._mjpegLoopId = window.requestAnimationFrame(draw);
        };

        if (!this._mjpegLoopId) {
            this._mjpegLoopId = window.requestAnimationFrame(draw);
        }
    }

    stopMjpegRender() {
        try {
            if (this._mjpegLoopId) {
                window.cancelAnimationFrame(this._mjpegLoopId);
                this._mjpegLoopId = null;
            }
        } catch (e) {}
        this._stabilizedImg = null;
    }
}

const app = new CameraRecorder();
