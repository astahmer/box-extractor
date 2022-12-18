# box-extractor

https://twitter.com/astahmer_dev/status/1601244606133567488

![Screenshot 2022-12-18 at 11 35 31](https://user-images.githubusercontent.com/47224540/208293575-811808ac-db7f-4443-b977-323a9cf25ac9.png)

https://twitter.com/astahmer_dev/status/1601246126396428289


## TODO
this is a WIP, even tho most features are done, there are some TODO's. some things that are missing: 

### features
- autodetection of wrapping functions (just like I did for components)
- extraction of values inside a non-ternary condition (`xx ?? yy`, or `xx || yy`)

### others
- tsup/esbuild example
- logs debug (instead of all those commented console.log)
- changeset for versioning
- include VE's fork (as tgz) for their packages: vite-plugin / esbuild-plugin / integration / sprinkles while waiting for the PR I made to VE https://github.com/vanilla-extract-css/vanilla-extract/pull/942 to be merged
