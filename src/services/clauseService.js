import Clause from '~/models/Clause';
import aiService from './aiService';
import contractService from './contractService';
import cacheService from './cacheService';

class ClauseService {
	async searchClauses(query, filters = {}, options = {}) {
		// Generate cache key based on query and filters
		const cacheKey = `search:${JSON.stringify({ query, filters, options })}`;

		// Try to get from cache first
		const cached = await cacheService.getCachedClauses(cacheKey);
		if (cached) {
			return cached;
		}

		const searchQuery = {
			$or: [
				{ title: { $regex: query, $options: 'i' } },
				{ content: { $regex: query, $options: 'i' } },
				{ keywords: { $in: [new RegExp(query, 'i')] } }
			],
			...filters
		};

		// Use pagination if options are provided
		if (options.page || options.limit) {
			const result = await Clause.paginate(options, null, searchQuery);
			// Cache the result
			await cacheService.cacheClauses(cacheKey, result);
			return result;
		}

		// Fallback to simple find with limit
		const result = await Clause.find(searchQuery).sort({ isMustHave: -1, createdAt: -1 }).limit(5);
		// Cache the result
		await cacheService.cacheClauses(cacheKey, result);
		return result;
	}

	async getClausesByCategory(category, filters = {}, options = {}) {
		// Generate cache key based on category and filters
		const cacheKey = `category:${category}:${JSON.stringify({ filters, options })}`;

		// Try to get from cache first
		const cached = await cacheService.getCachedClauses(cacheKey);
		if (cached) {
			return cached;
		}

		const searchQuery = { category, ...filters };

		// Use pagination if options are provided
		if (options.page || options.limit) {
			const result = await Clause.paginate(options, null, searchQuery);
			// Cache the result
			await cacheService.cacheClauses(cacheKey, result);
			return result;
		}

		// Fallback to simple find
		const result = await Clause.find(searchQuery).sort({ isMustHave: -1, createdAt: -1 });
		// Cache the result
		await cacheService.cacheClauses(cacheKey, result);
		return result;
	}

	async getMustHaveClauses(contractType, options = {}) {
		// Try to get from cache first
		const cached = await cacheService.getCachedMustHaveClauses(contractType);
		if (cached) {
			return cached;
		}

		const searchQuery = {
			isMustHave: true,
			contractTypes: contractType
		};

		// Use pagination if options are provided
		if (options.page || options.limit) {
			const result = await Clause.paginate(options, null, searchQuery);
			// Cache the result
			await cacheService.cacheMustHaveClauses(contractType, result);
			return result;
		}

		// Fallback to simple find
		const result = await Clause.find(searchQuery).sort({ category: 1 });
		// Cache the result
		await cacheService.cacheMustHaveClauses(contractType, result);
		return result;
	}

	async createClause(clauseData) {
		const clause = new Clause(clauseData);
		const result = await clause.save();

		// Invalidate relevant caches
		await cacheService.invalidateCache('clauses:*');
		await cacheService.invalidateCache('must_have_clauses:*');

		return result;
	}

	async updateClause(id, updateData) {
		const result = await Clause.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });

		// Invalidate relevant caches
		await cacheService.invalidateCache('clauses:*');
		await cacheService.invalidateCache('must_have_clauses:*');

		return result;
	}

	async deleteClause(id) {
		const result = await Clause.findByIdAndDelete(id);

		// Invalidate relevant caches
		await cacheService.invalidateCache('clauses:*');
		await cacheService.invalidateCache('must_have_clauses:*');

		return result;
	}

	async getClauseById(id) {
		return Clause.findById(id);
	}

	async addToPersonalLibrary(userId, clauseId) {
		// Implementation for adding clause to user's personal library
		// This would typically involve another model for user's saved clauses
		throw new Error('Not implemented');
	}

	async rewriteClause(clauseId, contractId, tone) {
		const clause = await this.getClauseById(clauseId);
		if (!clause) {
			throw new Error('Clause not found');
		}

		const contract = await contractService.getContract(contractId);
		if (!contract) {
			throw new Error('Contract not found');
		}

		// Build context from contract details
		const context = `Contract Title: ${contract.title}
Contract Type: ${contract.type}
Jurisdiction: ${contract.jurisdiction}
Start Date: ${contract.startDate}
End Date: ${contract.endDate}
Description: ${contract.description}
Content: ${typeof contract.content === 'string' ? contract.content : JSON.stringify(contract.content)}`;

		const prompt = `Given the following contract details:\n${context}\n\nRewrite the following clause so it fits this contract context. Return only the rewritten clause content, not any explanation.\n\nClause:\n${clause.content}`;
		const rewrittenContent = await aiService.generateContent(prompt, {
			systemPrompt:
				'You are a legal writing expert. Rewrite contract clauses to fit the provided contract context while maintaining legal accuracy.' +
				(tone ? ` Use a ${tone} tone.` : ''),
			temperature: 0.6
		});

		// Return the clause in the same format, but with updated content and tone if provided
		return {
			...clause.toObject(),
			content: rewrittenContent,
			tone: tone || clause.tone
		};
	}

	async getAllClauses(options = {}) {
		// Generate cache key based on options
		const cacheKey = `all:${JSON.stringify(options)}`;

		// Try to get from cache first
		const cached = await cacheService.getCachedClauses(cacheKey);
		if (cached) {
			return cached;
		}

		// Use pagination if options are provided
		if (options.page || options.limit) {
			const result = await Clause.paginate(options);
			// Cache the result
			await cacheService.cacheClauses(cacheKey, result);
			return result;
		}

		// Fallback to simple find
		const result = await Clause.find();
		// Cache the result
		await cacheService.cacheClauses(cacheKey, result);
		return result;
	}
}

export default new ClauseService();
