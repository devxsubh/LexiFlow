import mongoose from 'mongoose';
import paginate from './plugins/paginatePlugin.js';
import toJSON from './plugins/toJSONPlugin.js';

const permissionSchema = new mongoose.Schema(
	{
		controller: {
			type: String,
			required: true,
			trim: true
		},
		action: {
			type: String,
			required: true,
			trim: true
		},
		description: {
			type: String,
			trim: true
		}
	},
	{
		timestamps: true
	}
);

permissionSchema.plugin(toJSON);
permissionSchema.plugin(paginate);

// Compound index for unique controller:action pairs
permissionSchema.index({ controller: 1, action: 1 }, { unique: true });

const Permission = mongoose.model('Permission', permissionSchema);

export default Permission;
