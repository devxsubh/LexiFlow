import Contract from '~/models/contract';
import { generateContractSections, rewriteSection, suggestClause } from '~/services/aiService';
import PDFDocument from 'pdfkit';
import SharedContract from '~/models/sharedContract';
import config from '~/config/config';
import emailService from '~/services/emailService/index';
import pdfService from '~/services/pdfService';

class ContractService {
	async createContract(contractData, userId) {
		const contract = new Contract({
			...contractData,
			userId
		});
		await contract.save();
		return contract;
	}

	async getContract(contractId) {
		const contract = await Contract.findById(contractId);
		if (!contract) {
			throw new Error('Contract not found');
		}
		return contract;
	}

	async getUserContracts(userId, query) {
		const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;
		const skip = (page - 1) * limit;

		const contracts = await Contract.find({ userId })
			.sort({ isFavorite: -1, [sortBy]: sortOrder === 'desc' ? -1 : 1 })
			.skip(skip)
			.limit(limit);

		const total = await Contract.countDocuments({ userId });

		return {
			contracts,
			pagination: {
				total,
				page: Number(page),
				limit: Number(limit),
				pages: Math.ceil(total / limit)
			}
		};
	}

	async updateContract(contractId, updateData, userId) {
		const contract = await Contract.findOne({ _id: contractId, userId });
		if (!contract) {
			throw new Error('Contract not found');
		}

		Object.assign(contract, updateData);
		await contract.save();
		return contract;
	}

	async deleteContract(contractId, userId) {
		const contract = await Contract.findOneAndDelete({ _id: contractId, userId });
		if (!contract) {
			throw new Error('Contract not found');
		}
		return { message: 'Contract deleted successfully' };
	}

	async generateContractSections(contractType, parties) {
		return await generateContractSections(contractType, parties);
	}

	async rewriteSection(sectionContent, style) {
		return await rewriteSection(sectionContent, style);
	}

	async suggestClause(context, type) {
		return await suggestClause(context, type);
	}

	async generateContractPDF(contractId) {
		const contract = await Contract.findById(contractId);
		if (!contract) throw new Error('Contract not found');

		return new Promise((resolve, reject) => {
			const doc = new PDFDocument();
			const buffers = [];

			doc.on('data', buffers.push.bind(buffers));
			doc.on('end', () => {
				const pdfBuffer = Buffer.concat(buffers);
				resolve(pdfBuffer);
			});

			doc.fontSize(20).text(contract.title, { align: 'center' });
			doc.moveDown();
			doc.fontSize(12).text(`Type: ${contract.type}`);
			doc.text(`Jurisdiction: ${contract.jurisdiction}`);
			doc.text(`Start Date: ${contract.startDate}`);
			doc.text(`End Date: ${contract.endDate}`);
			doc.moveDown();

			doc.fontSize(14).text('Parties:', { underline: true });
			contract.parties.forEach((party, idx) => {
				doc.text(`${idx + 1}. ${party.name} (${party.role}) - ${party.email}`);
			});
			doc.moveDown();

			doc.fontSize(14).text('Content:', { underline: true });
			doc.text(contract.content);

			doc.end();
		});
	}

	async downloadContractPDF(contractId, userId) {
		const contract = await Contract.findById(contractId);
		if (!contract) {
			throw new Error('Contract not found');
		}

		// Check if user has access to this contract
		if (contract.userId.toString() !== userId.toString()) {
			throw new Error('Unauthorized to access this contract');
		}

		// Generate PDF using the PDF service
		const pdfBuffer = await pdfService.generateContractPDF(contract);

		return {
			pdfBuffer,
			filename: `${contract.title.replace(/[^a-zA-Z0-9]/g, '_')}_${contract.lexiId}.pdf`
		};
	}

	// Generate a shareable link for a contract
	async generateShareableLink(contractId, userId, { expiresIn, accessType, shareType, allowedEmails, regenerate }) {
		// Calculate expiration date
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + expiresIn);

		// Check if user already has a shareable link for this contract
		let sharedContract = await SharedContract.findOne({
			contractId,
			createdBy: userId,
			isActive: true
		});

		if (sharedContract && !regenerate) {
			// Update existing shareable link
			sharedContract.accessType = accessType;
			sharedContract.shareType = shareType;
			sharedContract.expiresAt = expiresAt;
			sharedContract.allowedEmails = shareType === 'restricted' ? allowedEmails : [];
			await sharedContract.save();

			// Send notifications to newly added emails for restricted sharing
			if (shareType === 'restricted' && allowedEmails && allowedEmails.length > 0) {
				const newEmails = allowedEmails.filter((email) => !sharedContract.allowedEmails.includes(email));
				if (newEmails.length > 0) {
					await Promise.all(newEmails.map((email) => emailService.sendContractShareNotification(sharedContract, email)));
				}
			}
		} else {
			// If there's an existing link and regenerate is true, deactivate it
			if (sharedContract) {
				sharedContract.isActive = false;
				await sharedContract.save();
			}

			// Generate new share token
			const shareToken = SharedContract.generateToken();

			// Create new shared contract record
			sharedContract = new SharedContract({
				contractId,
				shareToken,
				createdBy: userId,
				accessType,
				shareType,
				expiresAt,
				allowedEmails: shareType === 'restricted' ? allowedEmails : []
			});

			await sharedContract.save();

			// Send notifications to allowed emails for restricted sharing
			if (shareType === 'restricted' && allowedEmails && allowedEmails.length > 0) {
				await Promise.all(allowedEmails.map((email) => emailService.sendContractShareNotification(sharedContract, email)));
			}
		}

		// Generate shareable URL
		const shareableUrl = `${config.FRONTEND_URL}/contracts/shared/${sharedContract.shareToken}`;

		return {
			shareableUrl,
			expiresAt: sharedContract.expiresAt,
			accessType: sharedContract.accessType,
			shareType: sharedContract.shareType,
			allowedEmails: sharedContract.allowedEmails,
			isNew: !sharedContract.createdAt || new Date().getTime() - new Date(sharedContract.createdAt).getTime() < 1000,
			isRegenerated: regenerate
		};
	}

	async addToFavorite(contractId, userId) {
		const contract = await Contract.findOne({ _id: contractId, userId });
		if (!contract) {
			throw new Error('Contract not found');
		}
		contract.isFavorite = true;
		await contract.save();
		return contract;
	}

	async removeFromFavorite(contractId, userId) {
		const contract = await Contract.findOne({ _id: contractId, userId });
		if (!contract) {
			throw new Error('Contract not found');
		}
		contract.isFavorite = false;
		await contract.save();
		return contract;
	}
}

export default new ContractService();
