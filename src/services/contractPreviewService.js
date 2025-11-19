import puppeteer from 'puppeteer';
import Contract from '~/models/contract';

class ContractPreviewService {
	async generatePreview(contractId, options = {}) {
		const { width = 800, height = 1000, showWatermark = true, theme = 'default' } = options;

		const contract = await Contract.findById(contractId);
		if (!contract) throw new Error('Contract not found');

		let browser;
		try {
			// Enhanced Puppeteer configuration for production (Render/Heroku)
			const isProduction = process.env.NODE_ENV === 'production';

			// Try multiple approaches for finding Chrome
			let browser;
			const launchOptions = {
				headless: 'new',
				args: [
					'--no-sandbox',
					'--disable-setuid-sandbox',
					'--disable-dev-shm-usage',
					'--disable-accelerated-2d-canvas',
					'--no-first-run',
					'--no-zygote',
					'--single-process',
					'--disable-gpu',
					'--disable-web-security',
					'--disable-features=VizDisplayCompositor'
				]
			};

			if (isProduction) {
				// Try to find Chrome in common locations first
				const fs = await import('fs');
				const chromePaths = [
					'/usr/bin/google-chrome-stable',
					'/usr/bin/google-chrome',
					'/usr/bin/chromium-browser',
					'/usr/bin/chromium',
					'/opt/render/.cache/puppeteer/chrome/linux-137.0.7151.55/chrome-linux64/chrome'
				];

				let executablePath;
				for (const path of chromePaths) {
					if (fs.existsSync(path)) {
						executablePath = path;
						break;
					}
				}

				if (executablePath) {
					launchOptions.executablePath = executablePath;
				}
			}

			// Try launching with the configured options
			try {
				browser = await puppeteer.launch(launchOptions);
			} catch (firstError) {
				console.log('First launch attempt failed, trying without executablePath...');
				// If that fails, try without specifying executablePath (use bundled Chromium)
				delete launchOptions.executablePath;
				browser = await puppeteer.launch(launchOptions);
			}

			const page = await browser.newPage();

			// Set viewport to desired preview size
			await page.setViewport({
				width,
				height,
				deviceScaleFactor: 2 // Higher resolution for better quality
			});

			// Generate HTML content with styling
			const htmlContent = this.generateContractHtml(contract, {
				showWatermark,
				theme
			});

			// Set content and wait for network idle
			await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

			// Take screenshot of the first page
			const screenshot = await page.screenshot({
				type: 'jpeg',
				quality: 80,
				fullPage: false
			});

			return screenshot;
		} catch (error) {
			console.error('Puppeteer error in generatePreview:', error);

			// If Puppeteer completely fails, return a fallback response
			if (
				error.message.includes('Could not find Chrome') ||
				error.message.includes('Could not find browser') ||
				error.message.includes('Browser was not found')
			) {
				console.log('Chrome not available, generating fallback preview...');
				return this.generateFallbackPreview(contract, options);
			}

			throw new Error(`Preview generation failed: ${error.message}`);
		} finally {
			if (browser) {
				await browser.close();
			}
		}
	}

	generateFallbackPreview(contract, options) {
		// Generate a simple text-based preview when Chrome is not available
		const { width = 800, height = 1000 } = options;

		// Create a simple canvas-like representation using text
		const canvas = `
			<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
				<rect width="100%" height="100%" fill="#f8f9fa"/>
				<rect x="20" y="20" width="${width - 40}" height="${height - 40}" fill="white" stroke="#dee2e6" stroke-width="2"/>
				
				<!-- Header -->
				<rect x="40" y="40" width="${width - 80}" height="60" fill="#007bff" opacity="0.1"/>
				<text x="50" y="70" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#007bff">
					${contract.title || 'Untitled Contract'}
				</text>
				<text x="50" y="90" font-family="Arial, sans-serif" font-size="14" fill="#6c757d">
					${contract.contractType?.name || 'Contract Type'}
				</text>
				
				<!-- Content Area -->
				<text x="50" y="130" font-family="Arial, sans-serif" font-size="12" fill="#495057">
					Contract ID: ${contract._id}
				</text>
				<text x="50" y="150" font-family="Arial, sans-serif" font-size="12" fill="#495057">
					Status: ${contract.status || 'Draft'}
				</text>
				<text x="50" y="170" font-family="Arial, sans-serif" font-size="12" fill="#495057">
					Created: ${new Date(contract.createdAt).toLocaleDateString()}
				</text>
				
				<!-- Parties Section -->
				<text x="50" y="210" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#343a40">
					Parties:
				</text>
				${
					contract.parties
						?.map(
							(party, index) => `
					<text x="70" y="${230 + index * 20}" font-family="Arial, sans-serif" font-size="12" fill="#495057">
						• ${party.name || party.role || 'Party ' + (index + 1)}
					</text>
				`
						)
						.join('') ||
					'<text x="70" y="230" font-family="Arial, sans-serif" font-size="12" fill="#6c757d">No parties defined</text>'
				}
				
				<!-- Footer -->
				<text x="50" y="${height - 60}" font-family="Arial, sans-serif" font-size="10" fill="#6c757d">
					Preview generated by LexiFlow
				</text>
				<text x="50" y="${height - 40}" font-family="Arial, sans-serif" font-size="10" fill="#6c757d">
					Chrome not available - using fallback preview
				</text>
			</svg>
		`;

		// Convert SVG to buffer
		return Buffer.from(canvas, 'utf8');
	}

	generateContractHtml(contract, options) {
		const { showWatermark, theme } = options;
		const themeStyles = this.getThemeStyles(theme);

		return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            ${themeStyles}
            ${showWatermark ? this.getWatermarkStyles() : ''}
            
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background: white;
            }

            .contract-container {
              max-width: 100%;
              margin: 0 auto;
              position: relative;
            }

            .contract-header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #333;
              padding-bottom: 15px;
            }

            .contract-title {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 5px;
            }

            .contract-type {
              font-size: 14px;
              color: #666;
            }

            .parties-section {
              margin: 20px 0;
            }

            .party-card {
              border: 1px solid #ddd;
              padding: 10px;
              margin: 5px 0;
              border-radius: 4px;
              font-size: 12px;
            }

            .party-name {
              font-weight: bold;
              font-size: 14px;
              margin-bottom: 3px;
            }

            .party-role {
              color: #666;
              font-style: italic;
              font-size: 12px;
            }

            .contract-content {
              margin: 20px 0;
              line-height: 1.4;
              font-size: 12px;
            }

            .contract-meta {
              margin: 15px 0;
              padding: 10px;
              background: #f5f5f5;
              border-radius: 4px;
              font-size: 12px;
            }

            .meta-item {
              margin: 3px 0;
            }

            .meta-label {
              font-weight: bold;
              margin-right: 5px;
            }

            .watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 48px;
              color: rgba(0, 0, 0, 0.1);
              pointer-events: none;
              white-space: nowrap;
              z-index: 1000;
            }

            .clause-item {
              margin-bottom: 15px;
            }

            .clause-title {
              font-size: 14px;
              margin-bottom: 5px;
            }

            .clause-content {
              font-size: 12px;
              line-height: 1.5;
            }
          </style>
        </head>
        <body>
          <div class="contract-container">
            ${showWatermark ? this.getWatermarkHtml() : ''}
            
            <div class="contract-header">
              <div class="contract-title">${contract.title}</div>
              <div class="contract-type">${contract.type}</div>
            </div>

            <div class="contract-meta">
              <div class="meta-item">
                <span class="meta-label">Jurisdiction:</span>
                ${contract.jurisdiction}
              </div>
              <div class="meta-item">
                <span class="meta-label">Start Date:</span>
                ${new Date(contract.startDate).toLocaleDateString()}
              </div>
              <div class="meta-item">
                <span class="meta-label">End Date:</span>
                ${new Date(contract.endDate).toLocaleDateString()}
              </div>
            </div>

            <div class="parties-section">
              <h2 style="font-size: 16px; margin-bottom: 10px;">Parties</h2>
              ${contract.parties
								.map(
									(party) => `
                <div class="party-card">
                  <div class="party-name">${party.name}</div>
                  <div class="party-role">${party.role}</div>
                  <div>Email: ${party.email}</div>
                  <div>Aadhaar: ${party.aadhaar}</div>
                </div>
              `
								)
								.join('')}
            </div>

            <div class="contract-content">
              <h2 style="font-size: 16px; margin-bottom: 10px;">Contract Terms</h2>
              <div>${this.formatContractContent(contract.content)}</div>
            </div>
          </div>
        </body>
      </html>
    `;
	}

	getThemeStyles(theme) {
		const themes = {
			default: `
        body {
          font-family: Arial, sans-serif;
          line-height: 1.4;
          color: #333;
        }
      `,
			modern: `
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.4;
          color: #2c3e50;
        }
        .contract-header {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 6px;
        }
        .party-card {
          background: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
      `,
			classic: `
        body {
          font-family: 'Times New Roman', Times, serif;
          line-height: 1.6;
          color: #000;
        }
        .contract-header {
          border-bottom: 2px solid #000;
        }
      `
		};

		return themes[theme] || themes.default;
	}

	getWatermarkStyles() {
		return `
      .watermark {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-45deg);
        font-size: 48px;
        color: rgba(0, 0, 0, 0.1);
        pointer-events: none;
        white-space: nowrap;
        z-index: 1000;
      }
    `;
	}

	getWatermarkHtml() {
		return '<div class="watermark">DRAFT</div>';
	}

	formatContractContent(content) {
		// Ensure content is a string before processing
		let contentString = '';

		if (typeof content === 'string') {
			contentString = content;
		} else if (typeof content === 'object' && content !== null) {
			// If content is an object, try to stringify it
			try {
				contentString = JSON.stringify(content);
			} catch (e) {
				contentString = String(content);
			}
		} else {
			contentString = String(content);
		}

		try {
			const parsedContent = JSON.parse(contentString);
			if (parsedContent && Array.isArray(parsedContent.clauses)) {
				return parsedContent.clauses
					.map((clause) => {
						// Format clause title: replace **text** with <b>text</b>
						const formattedTitle = (clause.title || '').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

						// Format clause content: use span with strong inline style for explicit bolding, then newlines for paragraphs, and line breaks
						const clauseContent = clause.content || '';
						const contentWithExplicitBolds = clauseContent.replace(
							/\*\*(.*?)\*\*/g,
							'<span style="font-weight: bold !important;">$1</span>'
						);
						const formattedClauseContent = contentWithExplicitBolds
							.split(/\n\s*\n/)
							.map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br/>')}</p>`)
							.join('');

						return `
							<div class="clause-item">
								<h3 class="clause-title">${formattedTitle}</h3>
								<div class="clause-content">${formattedClauseContent}</div>
							</div>
						`;
					})
					.join('');
			} else {
				// Fallback for non-JSON content or missing clauses array
				// Apply bolding with inline style for explicit bolding, and basic newline formatting
				let formattedContent = contentString.replace(/\*\*(.*?)\*\*/g, '<span style="font-weight: bold !important;">$1</span>');
				formattedContent = formattedContent
					.split(/\\n\s*\\n/)
					.map((paragraph) => `<p>${paragraph.replace(/\\n/g, '<br/>')}</p>`)
					.join('');
				return formattedContent;
			}
		} catch (e) {
			// Fallback for invalid JSON or plain text content
			// Apply bolding with inline style for explicit bolding, and basic newline formatting
			let formattedContent = contentString.replace(/\*\*(.*?)\*\*/g, '<span style="font-weight: bold !important;">$1</span>');
			formattedContent = formattedContent
				.split(/\\n\s*\\n/)
				.map((paragraph) => `<p>${paragraph.replace(/\\n/g, '<br/>')}</p>`)
				.join('');
			return formattedContent;
		}
	}
}

export default new ContractPreviewService();
