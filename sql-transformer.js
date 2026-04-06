/**
 * Custom Metro transformer for .sql files
 * Wraps raw SQL content in a JS module that exports the string
 */
const upstreamTransformer = require('@expo/metro-config/babel-transformer')

module.exports.transform = async function ({ src, filename, options }) {
  if (filename.endsWith('.sql')) {
    // Convert SQL file content to a JS module exporting the string
    const escaped = JSON.stringify(src)
    const jsSource = `export default ${escaped};`
    return upstreamTransformer.transform({
      src: jsSource,
      filename,
      options,
    })
  }
  return upstreamTransformer.transform({ src, filename, options })
}
