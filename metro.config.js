const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')

const config = getDefaultConfig(__dirname)

// Allow importing .sql files for Drizzle ORM migrations
config.resolver.sourceExts.push('sql')

// Allow importing .wasm files for expo-sqlite web support
config.resolver.assetExts = [...(config.resolver.assetExts || []), 'wasm']

// Custom transformer for .sql files (wraps SQL as JS string module)
config.transformer.babelTransformerPath = require.resolve('./sql-transformer')

// Add COOP/COEP headers for SharedArrayBuffer (required by expo-sqlite on web)
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
      res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
      return middleware(req, res, next)
    }
  },
}

module.exports = withNativeWind(config, { input: './global.css' })
