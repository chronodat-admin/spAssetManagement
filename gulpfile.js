'use strict';

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const webpack = require('webpack');
const build = require('@microsoft/sp-build-web');
const gulp = require('gulp');

function getBuildVersion() {
  try {
    const pkgSolution = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'config/package-solution.json'), 'utf8')
    );
    const baseVersion = String(pkgSolution.solution?.version || '1.0.0.0');
    const shortHash = execSync('git rev-parse --short HEAD', {
      cwd: __dirname,
      encoding: 'utf8'
    }).trim();
    let dirtySuffix = '';
    try {
      execSync('git diff --quiet && git diff --cached --quiet', {
        cwd: __dirname,
        stdio: 'ignore'
      });
    } catch {
      dirtySuffix = '+';
    }
    return shortHash ? `${baseVersion}-${shortHash}${dirtySuffix}` : baseVersion;
  } catch {
    try {
      const pkgSolution = JSON.parse(
        fs.readFileSync(path.join(__dirname, 'config/package-solution.json'), 'utf8')
      );
      return String(pkgSolution.solution?.version || '1.0.0.0');
    } catch {
      return '1.0.0.0';
    }
  }
}

build.addSuppression(
  `Warning - [sass] The local CSS class 'ms-Grid' is not camelCase and will not be type-safe.`
);
build.addSuppression(/Unexpected STDERR output from ESLint/);
build.addSuppression(/Error - \[lint\]/);
build.addSuppression(/Warning - \[webpack\]/);

build.configureWebpack.mergeConfig({
  additionalConfiguration: (generatedConfiguration) => {
    generatedConfiguration.resolve.alias = {
      ...generatedConfiguration.resolve.alias,
      '@griffel/react': path.resolve(__dirname, 'node_modules/@griffel/react'),
      '@griffel/core': path.resolve(__dirname, 'node_modules/@griffel/core'),
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom')
    };
    generatedConfiguration.plugins = generatedConfiguration.plugins || [];
    generatedConfiguration.plugins.push(
      new webpack.DefinePlugin({
        'process.env.ASSET_APP_VERSION': JSON.stringify(getBuildVersion())
      })
    );
    return generatedConfiguration;
  }
});

const getTasks = build.rig.getTasks;
build.rig.getTasks = function () {
  const result = getTasks.call(build.rig);
  result.set('serve', result.get('serve-deprecated'));
  return result;
};

build.initialize(gulp);
