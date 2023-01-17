import { Collection } from 'oceanic.js';
import config from '../../config/config.js';
import type { CodeJam } from '../../database/schemas/jam.js';
import type Main from '../../main.js';

export class CodeJamCommandPlugin {
	private instance: Main;
	// Cache of all tags mapped by guildId
	public cache: Collection<string, CodeJam>;

	public query;

	private cachingDisabled: boolean;

	public constructor(i: Main) {
		this.instance = i;
		this.cache = new Collection();
		this.query = this.instance.database.managers.jam;
		this.cachingDisabled = config.cacheDisabled.jam;

		this.init();
	}

	public async init(): Promise<void> {
		if (this.cachingDisabled) return;

		// Load all tags into cache
		const jams = await this.query.find();

		for (const jam of jams) {
			this.cache.set(jam.guild_id, jam);
		}
	}

	/**
	 * Creates a new code jam
	 * @param guildId
	 * @param roleId
	 * @param createdBy
	 * @param createdById
	 * @returns
	 */
	public async createCodeJam({
        guildId,
        name,
        description,
        roleId,
        image,
        start,
        end,
        entity,
        createdBy,
        createdById,
        channel
    }: {
        guildId: string;
        name: string;
        description: string;
        roleId?: string;
        image?: string;
        start: string;
        end: string;
        entity: string;
        createdBy: string;
        createdById: string;
        channel?: string
    }): Promise<CodeJam> {

		const jam = await this.query.create({
			guild_id: guildId,
			name: name,
            description: description,
			event_role_id: roleId,
			event_participants_id: [],
			event_managers_id: [],
            event_image_url: image,
            scheduledStartTime: start,
            scheduledEndTime: end,
            entityType: entity,
			created_by_name: createdBy,
			created_by_id: createdById,
			created_at: new Date()
		});

		if (!this.cachingDisabled) this.cache.set(guildId, jam);

		return jam;
	}

	/**
	 * Deletes a code jam
	 * @param guildId
	 * @returns
	 */
	public async deleteCodeJam(guildId: string): Promise<void> {
		await this.query.findOneAndDelete({ guild_id: guildId });
		if (!this.cachingDisabled) this.cache.delete(guildId);
	}

	/**
	 * Gets a code jam
	 * @param guildId
	 * @returns
	 */
	public async getCodeJam(guildId: string): Promise<CodeJam | null> {
		if (!this.cachingDisabled) {
			const jam = this.cache.get(guildId);
			if (jam) return jam;
		}

		const jam = await this.query.findOne({ guild_id: guildId });

		return jam;
	}

	/**
	 * Changes the name of the code jam
	 * @param guildId
	 * @param name
	 */
	public async updateJamName(guildId: string, name: string): Promise<void> {
		let result = await this.query.findOneAndUpdate(
			{ guild_id: guildId },
			{
				$set: {
					name: name,
					updated_at: new Date()
				}
			},
			{
				upsert: true,
				new: true
			}
		);

		if (!this.cachingDisabled) this.cache.set(guildId, result);
	}

    public async updateCodeJamDescription(guildId: string, description: string): Promise<void> {
        let result = await this.query.findOneAndUpdate({guild_id: guildId}, {
            $set: {
                description: description,
                updated_at: new Date()
            }
        }, {
            upsert: true,
            new: true
        })

        if (!this.cachingDisabled) this.cache.set(guildId, result);
    }

	/**
	 * Gets the role id of the code jam
	 * @param guildId
	 * @returns
	 */
	public async getJamRole(guildId: string): Promise<string | null> {
		if (!this.cachingDisabled) return this.cache.get(guildId)?.event_role_id ?? null;

		return await this.query.findOne({ guild_id: guildId }).then((jam) => jam?.event_role_id ?? null);
	}

	/**
	 * Sets the role id of the code jam
	 * @param guildId
	 * @param roleId
	 * @returns
	 */
	public async setJamRole(guildId: string, roleId: string): Promise<void> {
		let result = await this.query.findOneAndUpdate(
			{ guild_id: guildId },
			{
				$set: {
					event_role_id: roleId,
					updated_at: new Date()
				}
			},
			{
				upsert: true,
				new: true
			}
		);

		if (!this.cachingDisabled) this.cache.set(guildId, result);
	}

	/**
	 * Gets the list of participants of the code jam
	 * @param guildId
	 * @returns
	 */
	public async getJamParticipants(guildId: string): Promise<string[] | null> {
		if (!this.cachingDisabled) return this.cache.get(guildId)?.event_participants_ids ?? null;

		return await this.query.findOne({ guild_id: guildId }).then((jam) => jam?.event_participants_ids ?? null);
	}

	/**
	 * Adds a participant to the code jam
	 * @param guildId
	 * @param userId
	 * @returns
	 */
	public async addJamParticipant(guildId: string, userId: string): Promise<void> {
		let result = await this.query.findOneAndUpdate(
			{ guild_id: guildId },
			{
				$push: {
					event_participants_ids: userId
				},
				$set: {
					updated_at: new Date()
				}
			},
			{
				upsert: true,
				new: true
			}
		);

		if (!this.cachingDisabled) this.cache.set(guildId, result);
	}

	/**
	 * Removes a participant from the code jam
	 * @param guildId
	 * @param userId
	 * @returns
	 */
	public async removeJamParticipant(guildId: string, userId: string): Promise<void> {
		let result = await this.query.findOneAndUpdate(
			{ guild_id: guildId },
			{
				$pull: {
					event_participants_ids: userId
				},
				$set: {
					updated_at: new Date()
				}
			},
			{
				upsert: true,
				new: true
			}
		);

		if (!this.cachingDisabled) this.cache.set(guildId, result);
	}

	/**
	 * Gets the list of managers of the code jam
	 * @param guildId
	 * @returns
	 */
	public async getJamManagers(guildId: string): Promise<string[] | null> {
		if (!this.cachingDisabled) return this.cache.get(guildId)?.event_managers_ids ?? null;

		return await this.query.findOne({ guild_id: guildId }).then((jam) => jam?.event_managers_ids ?? null);
	}

	/**
	 * Adds a manager to the code jam
	 * @param guildId
	 * @param userId
	 * @returns
	 */
	public async addJamManager(guildId: string, userId: string): Promise<void> {
		let result = await this.query.findOneAndUpdate(
			{ guild_id: guildId },
			{
				$push: {
					event_managers_ids: userId
				},
				$set: {
					updated_at: new Date()
				}
			},
			{
				upsert: true,
				new: true
			}
		);

		if (!this.cachingDisabled) this.cache.set(guildId, result);
	}

	/**
	 * Removes a manager from the code jam
	 * @param guildId
	 * @param userId
	 * @returns
	 */
	public async removeJamManager(guildId: string, userId: string): Promise<void> {
		let result = await this.query.findOneAndUpdate(
			{ guild_id: guildId },
			{
				$pull: {
					event_managers_ids: userId
				},
				$set: {
					updated_at: new Date()
				}
			},
			{
				upsert: true,
				new: true
			}
		);

		if (!this.cachingDisabled) this.cache.set(guildId, result);
	}
}
