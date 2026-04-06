const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')

const config = getDefaultConfig(__dirname)

// Allow importing .sql files for Drizzle ORM migrations
config.resolver.sourceExts.push('sql')
config.transformer.babelTransformerPath = require.resolve('./sql-transformer')

module.exports = withNativeWind(config, { input: './global.css' })
