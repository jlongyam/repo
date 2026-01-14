const fsExtra = {
  readJson: jest.fn(),
  pathExists: jest.fn(),
  remove: jest.fn(),
  mkdir: jest.fn(),
  writeFile: jest.fn()
};

export default fsExtra;