module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { browsers: 'defaults' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript'
  ]
};
