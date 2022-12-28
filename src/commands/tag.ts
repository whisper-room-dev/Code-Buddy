import { ApplicationCommandOptionTypes, ApplicationCommandTypes, Permissions } from 'oceanic.js';
import { CreateCommand } from '../cmd/command.js';
import { isCanary } from '../config/config.js';
import { TagLimits } from '../database/schemas/tag.js';

export default CreateCommand({
	trigger: 'tag',
	description: 'Tags plugin',
	type: ApplicationCommandTypes.CHAT_INPUT,
	register: isCanary ? 'guild' : 'global',
	requiredBotPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'USE_EXTERNAL_EMOJIS'],
	options: (opt) => {
		opt
			.addOption('tag-1', ApplicationCommandOptionTypes.SUB_COMMAND, (option) => {
				option
					.setName('create')
					.setDescription('Create a tag')
					.addOption('name', ApplicationCommandOptionTypes.STRING, (option) => {
						option.setName('name').setDescription('The name of the tag').setRequired(true);
					})
					.addOption('content', ApplicationCommandOptionTypes.STRING, (option) => {
						option.setName('content').setDescription('The content of the tag').setRequired(true);
					});
			})
			.setDMPermission(false)
			opt
				.addOption('tag-2', ApplicationCommandOptionTypes.SUB_COMMAND, (option) => {
					option
						.setName('delete')
						.setDescription('Delete a tag')
						.addOption('name', ApplicationCommandOptionTypes.STRING, (option) => {
							option.setName('name').setDescription('The name of the tag').setRequired(true);
						});
				})
				.setDMPermission(false)
			opt
				.addOption('tag-3', ApplicationCommandOptionTypes.SUB_COMMAND, (option) => {
					option
						.setName('edit')
						.setDescription('Edit a tag')
						.addOption('name', ApplicationCommandOptionTypes.STRING, (option) => {
							option.setName('name').setDescription('The name of the tag').setRequired(true);
						})
						.addOption('content', ApplicationCommandOptionTypes.STRING, (option) => {
							option.setName('content').setDescription('The content of the tag').setRequired(true);
						});
				})
				.setDMPermission(false)
			opt
				.addOption('tag-4', ApplicationCommandOptionTypes.SUB_COMMAND, (option) => {
					option.setName('list').setDescription('List all tags in this server');
				})
				.setDMPermission(false),
			opt
				.addOption('tag-5', ApplicationCommandOptionTypes.SUB_COMMAND, (option) => {
					option
						.setName('view')
						.setDescription('View a tag')
						.addOption('name', ApplicationCommandOptionTypes.STRING, (option) => {
							option.setName('name').setDescription('The name of the tag').setRequired(true);
						});
				})
				.setDMPermission(false);
	},
	run: async (instance, interaction) => {
		await interaction.defer();

		const subCommand = interaction.data.options.getSubCommand(true);

		const tagLimits = instance.collections.commands.plugins.tags.GetTagLimit(interaction.guild!.id);

		if (subCommand.find((name) => name === 'create')) {

			if (!interaction.member?.permissions.has(Permissions.MANAGE_MESSAGES)) {
				return await interaction.createFollowup({
					content: `You need the following permissions: \`Manage Messages\` to execute this command.`,
				});
			}

			const name = interaction.data.options.getString('name', true);
			const content = interaction.data.options.getString('content', true);

			// Check if the tax limit has been reached

			if (tagLimits.limited) {
				return await interaction.createFollowup({
					content: `You have reached the tag limit of \`${TagLimits.MAX_CREATED_TAGS}\`! You can delete a tag to create a new one.`
				});
			}

			// Check if the tag already exists
			const tagExists = instance.collections.commands.plugins.tags.GetTag(interaction.guild!.id, name);

			if (tagExists) {
				return await interaction.createFollowup({
					content: `Tag \`${name}\` already exists!`
				});
			}

			const tag = await instance.collections.commands.plugins.tags.CreateTag(
				interaction.guild!.id,
				name,
				content,
				interaction.user.id,
				interaction.user.tag
			);

			return await interaction.createFollowup({
				content: `Tag \`${tag.name}\` created!`
			});
		}

		if (subCommand.find((name) => name === 'delete')) {

			if (!interaction.member?.permissions.has(Permissions.MANAGE_MESSAGES)) {
				return await interaction.createFollowup({
					content: `You need the following permissions: \`Manage Messages\` to execute this command.`
				});
			}

			const name = interaction.data.options.getString('name', true);

			// Check if the tag exists
			const tagExists = instance.collections.commands.plugins.tags.GetTag(interaction.guild!.id, name);

			if (!tagExists) {
				return await interaction.createFollowup({
					content: `Tag \`${name}\` doesn't exist!`
				});
			}

			await instance.collections.commands.plugins.tags.DeleteTag(interaction.guild!.id, name);

			return await interaction.createFollowup({
				content: `Tag deleted!`
			});
		}

		if (subCommand.find((name) => name === 'edit')) {

			if (!interaction.member?.permissions.has(Permissions.MANAGE_MESSAGES)) {
				return await interaction.createFollowup({
					content: `You need the following permissions: \`Manage Messages\` to execute this command.`
				});
			}

			const name = interaction.data.options.getString('name', true);
			const content = interaction.data.options.getString('content', true);

			// Check if the tag exists
			const tagExists = instance.collections.commands.plugins.tags.GetTag(interaction.guild!.id, name);

			if (!tagExists) {
				return await interaction.createFollowup({
					content: `Tag \`${name}\` doesn't exist!`
				});
			}

			const tag = await instance.collections.commands.plugins.tags.UpdateTag(interaction.guild!.id, name, content);

			return await interaction.createFollowup({
				content: `Tag \`${tag.name}\` edited!`
			});
		}

		if (subCommand.find((name) => name === 'list')) {
			const tags = instance.collections.commands.plugins.tags.GetTags(interaction.guild!.id);

			const noTags = tags.length === 0;

			return await interaction.createFollowup({
				content: `Available tags: ${
					noTags
						? 'No Tags created for this server.\n\nMembers with the __Manage Messages__ permission can create, update, and delete tags.'
						: tags.map((tag) => `\`${tag.name}\``).join(', ')
				}`
			});
		}

		if (subCommand.find((name) => name === 'view')) {
			const name = interaction.data.options.getString('name', true);
			const tag = instance.collections.commands.plugins.tags.GetTag(interaction.guild!.id, name);

			return await interaction.createFollowup({
				content: tag ? tag.content : 'Tag not found!'
			});
		}

		return await interaction.createFollowup({
			content: 'Invalid subcommand!'
		});
	}
});
