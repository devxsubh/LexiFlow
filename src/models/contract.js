import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const contractSchema = new mongoose.Schema(
	{
		lexiId: {
			type: String,
			unique: true,
			required: true,
			default: uuidv4
		},
		title: {
			type: String,
			required: true,
			trim: true
		},
		type: {
			type: String,
			required: true,
			trim: true,
			minlength: 2,
			maxlength: 100
		},
		contractType: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'ContractType',
			required: false
		},
		description: {
			type: String,
			required: true,
			trim: true
		},
		parties: [
			{
				name: {
					type: String,
					required: true
				},
				role: {
					type: String,
					required: true
				},
				email: {
					type: String,
					required: true
				},
				aadhaar: {
					type: String,
					required: false
				},
				dsc: {
					serialNumber: {
						type: String,
						required: false
					},
					validFrom: {
						type: Date,
						required: false
					},
					validTo: {
						type: Date,
						required: false
					}
				}
			}
		],
		jurisdiction: {
			type: String,
			required: true,
			trim: true
		},
		startDate: {
			type: Date,
			required: true
		},
		endDate: {
			type: Date,
			required: true
		},
		content: {
			type: mongoose.Schema.Types.Mixed,
			required: true
		},
		status: {
			type: String,
			enum: ['draft', 'review', 'final'],
			default: 'draft'
		},
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true
		},
		isFavorite: {
			type: Boolean,
			default: false
		}
	},
	{
		timestamps: true
	}
);

// Ensure lexiId is set before saving (in case of direct instantiation)
contractSchema.pre('validate', function (next) {
	if (!this.lexiId) {
		this.lexiId = uuidv4();
	}
	next();
});

// Indexes for better query performance
contractSchema.index({ userId: 1, createdAt: -1 });
contractSchema.index({ contractType: 1 });
contractSchema.index({ type: 1 });
contractSchema.index({ status: 1 });

const Contract = mongoose.model('Contract', contractSchema);

export default Contract;
