import { runChecks } from "es-check";

async function checkMyFiles(list) {
  const configs = [
    {
      ecmaVersion: "es5",
      files: list,
      module: true,
      checkFeatures: true,
      checkPolyfill: true
    },
  ];

  const result = await runChecks(configs);

  if (result.success) {
    console.log("All files passed ES5 check!");
  } else {
    result.errors.forEach((error) => {
      console.log(error.file)
      console.log(error.err.features);
    });
  }

  return result;
}
let args = process.argv.slice(2)
checkMyFiles(args)