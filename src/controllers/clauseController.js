import clauseService from '~/services/clauseService';
import { validateClause } from '~/validations/clauseValidation';
import _ from 'lodash';

class ClauseController {
	async searchClauses(req, res) {
		try {
			const { query, category, jurisdiction, contractType } = req.query;
			const filters = {};

			if (category) filters.category = category;
			if (jurisdiction) filters.jurisdiction = jurisdiction;
			if (contractType) filters.contractTypes = contractType;

			// Extract pagination options
			const options = _.pick(req.query, ['limit', 'page', 'sortBy', 'sortDirection']);

			const clauses = await clauseService.searchClauses(query, filters, options);

			// Handle paginated response
			if (clauses.results) {
				return res.json({
					success: true,
					data: clauses.results,
					pagination: {
						total: clauses.totalResults
					}
				});
			}

			res.json({ success: true, data: clauses });
		} catch (error) {
			res.status(500).json({ success: false, error: error.message });
		}
	}

	async getClausesByCategory(req, res) {
		try {
			const { category } = req.params;
			const { jurisdiction, contractType } = req.query;
			const filters = {};

			if (jurisdiction) filters.jurisdiction = jurisdiction;
			if (contractType) filters.contractTypes = contractType;

			// Extract pagination options
			const options = _.pick(req.query, ['limit', 'page', 'sortBy', 'sortDirection']);

			const clauses = await clauseService.getClausesByCategory(category, filters, options);

			// Handle paginated response
			if (clauses.results) {
				return res.json({
					success: true,
					data: clauses.results,
					pagination: {
						total: clauses.totalResults
					}
				});
			}

			res.json({ success: true, data: clauses });
		} catch (error) {
			res.status(500).json({ success: false, error: error.message });
		}
	}

	async getMustHaveClauses(req, res) {
		try {
			const { contractType } = req.params;

			// Extract pagination options
			const options = _.pick(req.query, ['limit', 'page', 'sortBy', 'sortDirection']);

			const clauses = await clauseService.getMustHaveClauses(contractType, options);

			// Handle paginated response
			if (clauses.results) {
				return res.json({
					success: true,
					data: clauses.results,
					pagination: {
						total: clauses.totalResults
					}
				});
			}

			res.json({ success: true, data: clauses });
		} catch (error) {
			res.status(500).json({ success: false, error: error.message });
		}
	}

	async createClause(req, res) {
		try {
			const validation = validateClause(req.body);
			if (!validation.success) {
				return res.status(400).json({ success: false, error: validation.error });
			}

			const clause = await clauseService.createClause({
				...req.body,
				createdBy: req.user._id
			});
			res.status(201).json({ success: true, data: clause });
		} catch (error) {
			res.status(500).json({ success: false, error: error.message });
		}
	}

	async updateClause(req, res) {
		try {
			const { id } = req.params;
			const validation = validateClause(req.body);
			if (!validation.success) {
				return res.status(400).json({ success: false, error: validation.error });
			}

			const clause = await clauseService.updateClause(id, req.body);
			if (!clause) {
				return res.status(404).json({ success: false, error: 'Clause not found' });
			}
			res.json({ success: true, data: clause });
		} catch (error) {
			res.status(500).json({ success: false, error: error.message });
		}
	}

	async deleteClause(req, res) {
		try {
			const { id } = req.params;
			const clause = await clauseService.deleteClause(id);
			if (!clause) {
				return res.status(404).json({ success: false, error: 'Clause not found' });
			}
			res.json({ success: true, message: 'Clause deleted successfully' });
		} catch (error) {
			res.status(500).json({ success: false, error: error.message });
		}
	}

	async rewriteClause(req, res) {
		try {
			const { id } = req.params;
			const { contractId, tone } = req.body;
			const clause = await clauseService.rewriteClause(id, contractId, tone);
			if (!clause) {
				return res.status(404).json({ success: false, error: 'Clause not found' });
			}
			res.json({ success: true, data: clause });
		} catch (error) {
			res.status(500).json({ success: false, error: error.message });
		}
	}

	async getAllClauses(req, res) {
		try {
			// Extract pagination options
			const options = _.pick(req.query, ['limit', 'page', 'sortBy', 'sortDirection']);

			const clauses = await clauseService.getAllClauses(options);

			// Handle paginated response
			if (clauses.results) {
				return res.json({
					success: true,
					data: clauses.results,
					pagination: {
						total: clauses.totalResults
					}
				});
			}

			res.json({ success: true, data: clauses });
		} catch (error) {
			res.status(500).json({ success: false, error: error.message });
		}
	}

	async getClauseById(req, res) {
		try {
			const { id } = req.params;
			const clause = await clauseService.getClauseById(id);
			if (!clause) {
				return res.status(404).json({ success: false, error: 'Clause not found' });
			}
			res.json({ success: true, data: clause });
		} catch (error) {
			res.status(500).json({ success: false, error: error.message });
		}
	}
}

export default new ClauseController();
