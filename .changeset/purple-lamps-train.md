---
"@box-extractor/core": minor
---

feat:

-   BoxNode (AST-like objects) / getBoxLiteralValue
-   better extraction for nested objects/conditionals, soon allowing usage of `css={{ ... }}` prop

refactor:

-   rm properties+conditionalProperties from ComponentUsedPropertiesStyle
-   rm ExtractedComponentProperties/ExtractedPropPair
-   rename UsedComponentsMap -> NodeMap
-   rename ComponentUsedPropertiesStyle -> PropNodeMap
-   rename ExtractedType -> BoxNode
-   rename TypeKind -> BoxKind
-   rename maybeLiteral -> maybeBoxNode
-   rename maybeObjectEntries -> maybeObjectLikeBox

chore:

-   output BoxNode in test snapshots
-   debug-logger
