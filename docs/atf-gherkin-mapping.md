# ATF Step Config to Gherkin Mapping

This mapping defines the Gherkin vocabulary for sn-quality contracts. Each ATF step config maps to one or more Gherkin sentences. When authoring contracts via `/sn-generate-contracts`, prefer these mapped steps. Fall back to custom Gherkin only when no ATF step covers the intent.

## How to Use

- When generating `.feature` files, match customer intent to ATF steps first
- Use the Gherkin sentence patterns below — they map 1:1 to ATF test steps
- Parameters in `<angle_brackets>` are filled from the scenario context
- Data tables map to ATF step input parameters
- Steps marked **(SP)** are Service Portal variants of platform UI steps
- Steps run in one of three environments: **Server** (server-side GlideRecord), **UI** (browser client test runner), or **Server-REST** (HTTP request/response)

## Quick Reference: Environment Key

| Environment Value | Label | Description |
|---|---|---|
| `6c2bcea1870312009dccc9ded0e3ecca` | Server | Runs server-side (GlideRecord, scripts) |
| `d2cb02e1870312009dccc9ded0e3ec7c` | UI | Runs in the browser (form, list, portal) |
| `1a49153a53322200b8a6c2e5dec5872a` | Server-REST | Runs server-side REST request/response |
| `f8d36827a32012100df567d1361e61b3` | Reusable | Reusable test utility step |

---

## Server Steps

### Record Insert
- **ATF Step:** Record Insert
- **sys_id:** `14872288df60220062fe6c7a4df26319`
- **Environment:** Server
- **Description:** Inserts a record into a table. Specify the field values to set on the new record. Outputs the table and sys_id of the new record.
- **Gherkin:**
  ```gherkin
  When I insert a record into "<table>" with:
    | field   | value   |
    | <field> | <value> |
  ```
- **Notes:** Output sys_id can be referenced by subsequent steps.

### Record Update
- **ATF Step:** Record Update
- **sys_id:** `17a72288df60220062fe6c7a4df26397`
- **Environment:** Server
- **Description:** Changes field values on a record on the server. It is strongly advised to follow with a Record Validation step.
- **Gherkin:**
  ```gherkin
  When I update the "<table>" record "<sys_id>" with:
    | field   | value   |
    | <field> | <value> |
  ```

### Record Delete
- **ATF Step:** Record Delete
- **sys_id:** `8df72288df60220062fe6c7a4df2636d`
- **Environment:** Server
- **Description:** Deletes a record in a table.
- **Gherkin:**
  ```gherkin
  When I delete the "<table>" record "<sys_id>"
  ```

### Record Query
- **ATF Step:** Record Query
- **sys_id:** `2d82e3c7531400109e02ddeeff7b12a7`
- **Environment:** Server
- **Description:** Performs a database query to verify if a record matching the conditions exists.
- **Gherkin:**
  ```gherkin
  Then a record in "<table>" exists where:
    | field   | operator | value   |
    | <field> | <op>     | <value> |
  ```
  ```gherkin
  Then no record in "<table>" exists where:
    | field   | operator | value   |
    | <field> | <op>     | <value> |
  ```

### Record Validation
- **ATF Step:** Record Validation
- **sys_id:** `1f39a288df60220062fe6c7a4df2639d`
- **Environment:** Server
- **Description:** Validates that a record meets the specified conditions on the server-side. Several conditions can be applied to the same field.
- **Gherkin:**
  ```gherkin
  Then the "<table>" record "<sys_id>" has:
    | field   | operator | value   |
    | <field> | <op>     | <value> |
  ```

### Impersonate
- **ATF Step:** Impersonate
- **sys_id:** `071ee5b253331200040729cac2dc348d`
- **Environment:** Server
- **Description:** Impersonates the specified user for the duration of the test or until another user is impersonated.
- **Gherkin:**
  ```gherkin
  Given I am impersonating user "<username>"
  ```

### Run Server Side Script
- **ATF Step:** Run Server Side Script
- **sys_id:** `41de4a935332120028bc29cac2dc349a`
- **Environment:** Server
- **Description:** Executes a script on the server.
- **Gherkin:**
  ```gherkin
  When I run server script:
    """
    <script_body>
    """
  ```

### Create a User
- **ATF Step:** Create a User
- **sys_id:** `d9bc5f21ff6033008d3f5d9ad53bf12d`
- **Environment:** Server
- **Description:** Creates a user with specified roles and groups. Optionally impersonates the user.
- **Gherkin:**
  ```gherkin
  Given a test user exists with:
    | property | value   |
    | roles    | <roles> |
    | groups   | <groups> |
  ```
  ```gherkin
  Given a test user exists with roles "<roles>" and I impersonate them
  ```

### Log
- **ATF Step:** Log
- **sys_id:** `58ab71985f30220012b44adb7f46661e`
- **Environment:** Server
- **Description:** Logs a message that can contain a variable or other information. Stored as a step result.
- **Gherkin:**
  ```gherkin
  And I log "<message>"
  ```

### Add Attachments to Existing Record
- **ATF Step:** Add Attachments to Existing Record
- **sys_id:** `52c6cdb3b710330044026848ee11a91d`
- **Environment:** Server
- **Description:** Adds attachments to a specified record (server-side only, no UI). Record must exist prior to this step.
- **Gherkin:**
  ```gherkin
  When I attach files to the "<table>" record "<sys_id>":
    | file_name   |
    | <file_name> |
  ```

### Replay Request Item
- **ATF Step:** Replay Request Item
- **sys_id:** `7f49ec32532022008aaec57906dc3473`
- **Environment:** Server
- **Description:** Replays a previously created request item with the same values and options.
- **Gherkin:**
  ```gherkin
  When I replay the request item "<request_item_sys_id>"
  ```

### Search for a Catalog Item
- **ATF Step:** Search for a Catalog Item
- **sys_id:** `96103fdfc3e0320076173b0ac3d3ae57`
- **Environment:** Server
- **Description:** Performs a search for a Catalog Item or Record Producer in a specified Catalog and Category.
- **Gherkin:**
  ```gherkin
  When I search for catalog item "<name>" in catalog "<catalog>" category "<category>"
  ```

### Checkout Shopping Cart
- **ATF Step:** Checkout Shopping Cart
- **sys_id:** `9a351369536303000a51ddeeff7b125b`
- **Environment:** Server
- **Description:** Checks out the Shopping Cart and generates a new request.
- **Gherkin:**
  ```gherkin
  When I checkout the shopping cart
  ```

### Custom Scripted StepConfig
- **ATF Step:** Custom Scripted StepConfig
- **sys_id:** `84e977b05330220002c6435723dc3410`
- **Environment:** Server
- **Description:** A custom script-based step config that can be reused in any test.
- **Gherkin:**
  ```gherkin
  When I run custom step "<step_config_name>" with:
    | input   | value   |
    | <input> | <value> |
  ```
- **Notes:** This is a template for custom step configs. Replace with the actual custom step name.

---

## Form Steps

### Open a New Form
- **ATF Step:** Open a New Form
- **sys_id:** `05317cd10b10220050192f15d6673af8`
- **Environment:** UI
- **Description:** Opens a new form for the selected table and Form UI. Optionally specify a view name.
- **Gherkin:**
  ```gherkin
  When I open a new "<table>" form
  ```
  ```gherkin
  When I open a new "<table>" form in view "<view>"
  ```

### Open an Existing Record
- **ATF Step:** Open an Existing Record
- **sys_id:** `5f2e0e535332120028bc29cac2dc34d3`
- **Environment:** UI
- **Description:** Opens an existing record in the selected table and Form UI. Optionally specify a view name.
- **Gherkin:**
  ```gherkin
  When I open the "<table>" record "<sys_id>"
  ```
  ```gherkin
  When I open the "<table>" record "<sys_id>" in view "<view>"
  ```

### Set Field Values
- **ATF Step:** Set Field Values
- **sys_id:** `fcae4a935332120028bc29cac2dc340e`
- **Environment:** UI
- **Description:** Sets field values on the current form. Requires an open form.
- **Gherkin:**
  ```gherkin
  When I set the following field values:
    | field   | value   |
    | <field> | <value> |
  ```

### Field Values Validation
- **ATF Step:** Field Values Validation
- **sys_id:** `1b97cd31872022008182c9ded0e3ece5`
- **Environment:** UI
- **Description:** Validates field values on the current form. Several conditions can be applied to the same field.
- **Gherkin:**
  ```gherkin
  Then the form field "<field>" is "<value>"
  ```
  ```gherkin
  Then the form fields have values:
    | field   | operator | value   |
    | <field> | <op>     | <value> |
  ```

### Field State Validation
- **ATF Step:** Field State Validation
- **sys_id:** `1dfece935332120028bc29cac2dc3478`
- **Environment:** UI
- **Description:** Validates states of fields: mandatory, not mandatory, read only, not read only, visible, not visible.
- **Gherkin:**
  ```gherkin
  Then the "<field>" field is "<state>"
  ```
  ```gherkin
  Then the following fields have states:
    | field   | state      |
    | <field> | <state>    |
  ```
- **Notes:** Valid states: `mandatory`, `not mandatory`, `read only`, `not read only`, `visible`, `not visible`.

### Submit a Form
- **ATF Step:** Submit a Form
- **sys_id:** `be8e0a935332120028bc29cac2dc34e4`
- **Environment:** UI
- **Description:** Submits the current form. Outputs the table and sys_id of the submitted record. Closes the form.
- **Gherkin:**
  ```gherkin
  When I submit the form
  ```

### Click a UI Action
- **ATF Step:** Click a UI Action
- **sys_id:** `0f4a128297202200abe4bb7503ac4af0`
- **Environment:** UI
- **Description:** Clicks a UI action on the current form. Outputs the table and sys_id of the record. Closes the form.
- **Gherkin:**
  ```gherkin
  When I click the "<action_name>" UI action
  ```

### UI Action Visibility
- **ATF Step:** UI Action Visibility
- **sys_id:** `d8fdf5e10b1022009cfdc71437673adc`
- **Environment:** UI
- **Description:** Validates whether UI Actions are visible or not on the current form.
- **Gherkin:**
  ```gherkin
  Then the "<action_name>" UI action is visible
  ```
  ```gherkin
  Then the "<action_name>" UI action is not visible
  ```
  ```gherkin
  Then the following UI actions have visibility:
    | action        | visible |
    | <action_name> | <bool>  |
  ```

### Click Modal Button
- **ATF Step:** Click Modal Button
- **sys_id:** `22aed143dfe0220062fe6c7a4df2639d`
- **Environment:** UI
- **Description:** Clicks a button within a modal. In workspace UI, optionally sets field values for the modal.
- **Gherkin:**
  ```gherkin
  When I click the "<button>" button on the modal
  ```
  ```gherkin
  When I confirm the modal
  ```
  ```gherkin
  When I cancel the modal
  ```

### Click a Declarative Action
- **ATF Step:** Click a Declarative Action
- **sys_id:** `49e34cbe433131106580a9bb1cb8f25c`
- **Environment:** UI
- **Description:** Clicks a declarative action on the current form. Outputs table and sys_id. Closes the form.
- **Gherkin:**
  ```gherkin
  When I click the "<action_name>" declarative action
  ```

### Declarative Action Visibility
- **ATF Step:** Declarative Action Visibility
- **sys_id:** `c52ed987437131106580a9bb1cb8f2b8`
- **Environment:** UI
- **Description:** Validates whether declarative actions are visible or not on the current form.
- **Gherkin:**
  ```gherkin
  Then the "<action_name>" declarative action is visible
  ```
  ```gherkin
  Then the "<action_name>" declarative action is not visible
  ```

### Add Attachments to Form
- **ATF Step:** Add Attachments to Form
- **sys_id:** `6932ee40b760330044026848ee11a960`
- **Environment:** UI
- **Description:** Adds attachments to the current form. Requires an open form (not yet submitted).
- **Gherkin:**
  ```gherkin
  When I attach files to the form:
    | file_name   |
    | <file_name> |
  ```

---

## List and Related List Steps

### Apply Filter to List
- **ATF Step:** Apply Filter to List
- **sys_id:** `a69843f2531332007e7829cac2dc34d7`
- **Environment:** UI
- **Description:** Applies a filter to a list. Clears any existing filter.
- **Gherkin:**
  ```gherkin
  When I filter the list where "<field>" <operator> "<value>"
  ```
  ```gherkin
  When I apply the filter "<encoded_query>" to the list
  ```

### Validate Record Present in List
- **ATF Step:** Validate Record Present in List
- **sys_id:** `7bdce31387400300709861fb97cb0b5a`
- **Environment:** UI
- **Description:** Validates the presence of a specified record in a list.
- **Gherkin:**
  ```gherkin
  Then the record "<sys_id>" is present in the list
  ```
  ```gherkin
  Then the record "<sys_id>" is not present in the list
  ```

### Open a Record in List
- **ATF Step:** Open a Record in List
- **sys_id:** `0200ac2fe72003005c85cd19d2f6a942`
- **Environment:** UI
- **Description:** Opens a specified record in a list.
- **Gherkin:**
  ```gherkin
  When I open record "<sys_id>" from the list
  ```

### Click a List UI Action
- **ATF Step:** Click a List UI Action
- **sys_id:** `c5f44934532332007e7829cac2dc342e`
- **Environment:** UI
- **Description:** Clicks a UI Action on a list. May navigate away from the current page.
- **Gherkin:**
  ```gherkin
  When I click the "<action_name>" list UI action
  ```

### Validate List UI Action Visibility
- **ATF Step:** Validate List UI Action Visibility
- **sys_id:** `012105620fe2330091d0f00c97767ec4`
- **Environment:** UI
- **Description:** Validates the visibility of UI Actions in a list.
- **Gherkin:**
  ```gherkin
  Then the "<action_name>" list UI action is visible
  ```
  ```gherkin
  Then the "<action_name>" list UI action is not visible
  ```

### Validate Related List Visibility
- **ATF Step:** Validate Related List Visibility
- **sys_id:** `8b84e5e837b1030064a52f3c8e41f170`
- **Environment:** UI
- **Description:** Validates the visibility of selected related lists on a form.
- **Gherkin:**
  ```gherkin
  Then the "<related_list>" related list is visible
  ```
  ```gherkin
  Then the "<related_list>" related list is not visible
  ```

---

## Service Catalog Steps

### Open a Catalog Item
- **ATF Step:** Open a Catalog Item
- **sys_id:** `2516c0e1c332220076173b0ac3d3ae39`
- **Environment:** UI
- **Description:** Opens a catalog item. User must have access to the item.
- **Gherkin:**
  ```gherkin
  When I open the catalog item "<name>"
  ```

### Order Catalog Item
- **ATF Step:** Order Catalog Item
- **sys_id:** `c930b4b2c310320076173b0ac3d3aeec`
- **Environment:** UI
- **Description:** Clicks Order Now to order a catalog item. Closes the catalog item page.
- **Gherkin:**
  ```gherkin
  When I order the catalog item
  ```

### Set Variable Values
- **ATF Step:** Set Variable Values
- **sys_id:** `323ca6e1c3b2220076173b0ac3d3aec1`
- **Environment:** UI
- **Description:** Sets variable values on the current Catalog Item or Record Producer page, or a form containing variable editor.
- **Gherkin:**
  ```gherkin
  When I set the following variable values:
    | variable   | value   |
    | <variable> | <value> |
  ```

### Validate Variable Values
- **ATF Step:** Validate Variable Values
- **sys_id:** `5a36c681c37e220076173b0ac3d3aecf`
- **Environment:** UI
- **Description:** Validates variable values on the Catalog Item, Record Producer, or page containing a variable editor.
- **Gherkin:**
  ```gherkin
  Then the variable "<variable>" has value "<value>"
  ```
  ```gherkin
  Then the following variables have values:
    | variable   | operator | value   |
    | <variable> | <op>     | <value> |
  ```

### Variable State Validation
- **ATF Step:** Variable State Validation
- **sys_id:** `33f637e8c3ba220076173b0ac3d3aee1`
- **Environment:** UI
- **Description:** Validates states of variables: mandatory, not mandatory, read only, not read only, visible, not visible.
- **Gherkin:**
  ```gherkin
  Then the variable "<variable>" is "<state>"
  ```
  ```gherkin
  Then the following variables have states:
    | variable   | state   |
    | <variable> | <state> |
  ```
- **Notes:** Valid states: `mandatory`, `not mandatory`, `read only`, `not read only`, `visible`, `not visible`.

### Set Catalog Item Quantity
- **ATF Step:** Set Catalog Item Quantity
- **sys_id:** `d5d9e7e7c3d7220076173b0ac3d3ae0b`
- **Environment:** UI
- **Description:** Sets the quantity on the current catalog item. Cannot be used with Record Producers.
- **Gherkin:**
  ```gherkin
  When I set the catalog item quantity to "<quantity>"
  ```

### Validate Price and Recurring Price
- **ATF Step:** Validate Price and Recurring Price
- **sys_id:** `70a083b0c323220076173b0ac3d3aee8`
- **Environment:** UI
- **Description:** Validates price and recurring price of a catalog item. Cannot be used with Record Producers.
- **Gherkin:**
  ```gherkin
  Then the catalog item price is "<price>"
  ```
  ```gherkin
  Then the catalog item recurring price is "<recurring_price>"
  ```

### Add Item to Shopping Cart
- **ATF Step:** Add Item to Shopping Cart
- **sys_id:** `550270f2c310320076173b0ac3d3aeec`
- **Environment:** UI
- **Description:** Adds the current item to the Shopping Cart. Closes the catalog item page.
- **Gherkin:**
  ```gherkin
  When I add the catalog item to the shopping cart
  ```

### Open a Record Producer
- **ATF Step:** Open a Record Producer
- **sys_id:** `77409f72c300320076173b0ac3d3ae19`
- **Environment:** UI
- **Description:** Opens a Record Producer. User must have access.
- **Gherkin:**
  ```gherkin
  When I open the record producer "<name>"
  ```

### Submit Record Producer
- **ATF Step:** Submit Record Producer
- **sys_id:** `ed59d8e5c332220076173b0ac3d3ae6a`
- **Environment:** UI
- **Description:** Submits the currently opened Record Producer. Closes the page.
- **Gherkin:**
  ```gherkin
  When I submit the record producer
  ```

---

## Service Catalog in Service Portal Steps

### Open a Catalog Item (SP)
- **ATF Step:** Open a Catalog Item (SP)
- **sys_id:** `e81f02dc73e703008e6b0d573cf6a76f`
- **Environment:** UI
- **Description:** Opens a catalog item in the Service Portal. URL parameters can be added.
- **Gherkin:**
  ```gherkin
  When I open the catalog item "<name>" in the service portal
  ```

### Order a Catalog Item (SP)
- **ATF Step:** Order a Catalog Item (SP)
- **sys_id:** `c0fede515f23030076861f9f2f7313db`
- **Environment:** UI
- **Description:** Clicks Order Now to order a catalog item in the Service Portal.
- **Gherkin:**
  ```gherkin
  When I order the catalog item in the service portal
  ```

### Set Variable Values (SP)
- **ATF Step:** Set Variable Values (SP)
- **sys_id:** `2e4229b48703030070870cf888cb0b5c`
- **Environment:** UI
- **Description:** Sets variable values on the current Catalog Item or Record Producer in the Service Portal.
- **Gherkin:**
  ```gherkin
  When I set the following variable values in the service portal:
    | variable   | value   |
    | <variable> | <value> |
  ```

### Validate Variable Values (SP)
- **ATF Step:** Validate Variable Values (SP)
- **sys_id:** `2c8882759f1303002528d4b4232e708a`
- **Environment:** UI
- **Description:** Validates variable values on the current Catalog Item or Record Producer in the Service Portal.
- **Gherkin:**
  ```gherkin
  Then the variable "<variable>" has value "<value>" in the service portal
  ```
  ```gherkin
  Then the following variables have values in the service portal:
    | variable   | operator | value   |
    | <variable> | <op>     | <value> |
  ```

### Variable State Validation (SP)
- **ATF Step:** Variable State Validation (SP)
- **sys_id:** `1ebb17799f1303002528d4b4232e70c0`
- **Environment:** UI
- **Description:** Validates states of variables in the Service Portal: mandatory, not mandatory, read only, not read only, visible, not visible.
- **Gherkin:**
  ```gherkin
  Then the variable "<variable>" is "<state>" in the service portal
  ```

### Validate Price and Recurring Price (SP)
- **ATF Step:** Validate Price and Recurring Price (SP)
- **sys_id:** `095c4877732b03008e6b0d573cf6a717`
- **Environment:** UI
- **Description:** Validates price and recurring price of a catalog item in the Service Portal.
- **Gherkin:**
  ```gherkin
  Then the catalog item price is "<price>" in the service portal
  ```
  ```gherkin
  Then the catalog item recurring price is "<recurring_price>" in the service portal
  ```

### Set Catalog Item Quantity (SP)
- **ATF Step:** Set Catalog Item Quantity (SP)
- **sys_id:** `697ce2d87323030076860d573cf6a708`
- **Environment:** UI
- **Description:** Sets the quantity on the current catalog item in the Service Portal. Cannot be used with Record Producers or Order Guides.
- **Gherkin:**
  ```gherkin
  When I set the catalog item quantity to "<quantity>" in the service portal
  ```

### Add Item to Shopping Cart (SP)
- **ATF Step:** Add Item to Shopping Cart (SP)
- **sys_id:** `00696ee073330300688e0d573cf6a71a`
- **Environment:** UI
- **Description:** Adds the current item to the Shopping Cart in the Service Portal.
- **Gherkin:**
  ```gherkin
  When I add the catalog item to the shopping cart in the service portal
  ```

### Open a Record Producer (SP)
- **ATF Step:** Open a Record Producer (SP)
- **sys_id:** `775638f29f3203002899d4b4232e70e5`
- **Environment:** UI
- **Description:** Opens a Record Producer in the Service Portal. URL parameters can be added.
- **Gherkin:**
  ```gherkin
  When I open the record producer "<name>" in the service portal
  ```

### Submit Record Producer (SP)
- **ATF Step:** Submit Record Producer (SP)
- **sys_id:** `7c69d2788743030070870cf888cb0b5f`
- **Environment:** UI
- **Description:** Submits the currently opened Record Producer in the Service Portal.
- **Gherkin:**
  ```gherkin
  When I submit the record producer in the service portal
  ```

### Open an Order Guide (SP)
- **ATF Step:** Open an Order Guide (SP)
- **sys_id:** `aced8452731b13008e6b0d573cf6a783`
- **Environment:** UI
- **Description:** Opens an order guide in the Service Portal. URL parameters can be added.
- **Gherkin:**
  ```gherkin
  When I open the order guide "<name>" in the service portal
  ```

### Navigate within Order Guide (SP)
- **ATF Step:** Navigate within Order Guide (SP)
- **sys_id:** `0ae5f9f2739713008e6b0d573cf6a718`
- **Environment:** UI
- **Description:** Navigates within an Order Guide (e.g., between steps).
- **Gherkin:**
  ```gherkin
  When I navigate to step "<step_name>" in the order guide
  ```

### Review Item in Order Guide (SP)
- **ATF Step:** Review Item in Order Guide (SP)
- **sys_id:** `2098710873631300688e0d573cf6a7d7`
- **Environment:** UI
- **Description:** Reviews individual items in the Order Guide and chooses to include or exclude them. Must be on the "Choose Options" stage.
- **Gherkin:**
  ```gherkin
  When I include the item "<item_name>" in the order guide
  ```
  ```gherkin
  When I exclude the item "<item_name>" from the order guide
  ```

### Validate Order Guide Items (SP)
- **ATF Step:** Validate Order Guide Items (SP)
- **sys_id:** `d7c0d0ef5f9b1300688e1f9f2f7313b7`
- **Environment:** UI
- **Description:** Validates items included in the Order Guide. Must be on the "Choose Options" stage.
- **Gherkin:**
  ```gherkin
  Then the order guide includes the items:
    | item_name   |
    | <item_name> |
  ```

### Review Order Guide Summary (SP)
- **ATF Step:** Review Order Guide Summary (SP)
- **sys_id:** `1df5d27073a71300688e0d573cf6a751`
- **Environment:** UI
- **Description:** Reviews the Order Guide Summary page. Must be on the "Summary" stage.
- **Gherkin:**
  ```gherkin
  Then I review the order guide summary
  ```

### Add Order Guide to Shopping Cart (SP)
- **ATF Step:** Add Order Guide to Shopping Cart (SP)
- **sys_id:** `559099f287131300b179480688cb0b1a`
- **Environment:** UI
- **Description:** Adds the Order Guide to the Shopping Cart. Must have navigated to the Summary section.
- **Gherkin:**
  ```gherkin
  When I add the order guide to the shopping cart in the service portal
  ```

### Submit an Order Guide (SP)
- **ATF Step:** Submit an Order Guide (SP)
- **sys_id:** `6ad01e9387131300b179480688cb0b8f`
- **Environment:** UI
- **Description:** Clicks Order Now to order an Order Guide in the Service Portal.
- **Gherkin:**
  ```gherkin
  When I submit the order guide in the service portal
  ```

### Add row to multi-row variable set (SP)
- **ATF Step:** Add row to multi-row variable set (SP)
- **sys_id:** `c7d557d673002300688e0d573cf6a74f`
- **Environment:** UI
- **Description:** Adds a row to a multi-row variable set on the current catalog item in the Service Portal.
- **Gherkin:**
  ```gherkin
  When I add a row to the multi-row variable set "<mrvs_name>" in the service portal
  ```

### Save current row of multi-row variable set (SP)
- **ATF Step:** Save current row of multi-row variable set (SP)
- **sys_id:** `adf6884273902300688e0d573cf6a72a`
- **Environment:** UI
- **Description:** Saves the current row of a multi-row variable set in the Service Portal.
- **Gherkin:**
  ```gherkin
  When I save the current row of the multi-row variable set in the service portal
  ```

---

## Service Portal Steps

### Open a Form (SP)
- **ATF Step:** Open a Form (SP)
- **sys_id:** `ca58a941e7020300b2888f49c2f6a95e`
- **Environment:** UI
- **Description:** Opens a Service Portal form. URL parameters: table, sys_id, view. Empty sys_id opens a new record.
- **Gherkin:**
  ```gherkin
  When I open a "<table>" form in the service portal
  ```
  ```gherkin
  When I open the "<table>" record "<sys_id>" in the service portal
  ```

### Set Field Values (SP)
- **ATF Step:** Set Field Values (SP)
- **sys_id:** `ba49e51de7420300b2888f49c2f6a93c`
- **Environment:** UI
- **Description:** Sets field values on a Service Portal form.
- **Gherkin:**
  ```gherkin
  When I set the following field values in the service portal:
    | field   | value   |
    | <field> | <value> |
  ```

### Field Values Validation (SP)
- **ATF Step:** Field Values Validation (SP)
- **sys_id:** `d72d0556e7020300b2888f49c2f6a916`
- **Environment:** UI
- **Description:** Validates field values on the current Service Portal form.
- **Gherkin:**
  ```gherkin
  Then the form field "<field>" is "<value>" in the service portal
  ```
  ```gherkin
  Then the form fields have values in the service portal:
    | field   | operator | value   |
    | <field> | <op>     | <value> |
  ```

### Field State Validation (SP)
- **ATF Step:** Field State Validation (SP)
- **sys_id:** `af1e769223220300ab65ff5e17bf6580`
- **Environment:** UI
- **Description:** Validates field states on a Service Portal form: mandatory, not mandatory, read only, not read only, visible, not visible.
- **Gherkin:**
  ```gherkin
  Then the "<field>" field is "<state>" in the service portal
  ```

### Submit a Form (SP)
- **ATF Step:** Submit a Form (SP)
- **sys_id:** `f410c93423220300ab65ff5e17bf651e`
- **Environment:** UI
- **Description:** Submits the current form on a Service Portal page. Outputs table and sys_id.
- **Gherkin:**
  ```gherkin
  When I submit the form in the service portal
  ```

### Click a UI Action (SP)
- **ATF Step:** Click a UI Action (SP)
- **sys_id:** `86ec986123630300ab65ff5e17bf65a5`
- **Environment:** UI
- **Description:** Clicks a UI Action on the current Service Portal form. Outputs table and sys_id.
- **Gherkin:**
  ```gherkin
  When I click the "<action_name>" UI action in the service portal
  ```

### UI Action Visibility Validation (SP)
- **ATF Step:** UI Action Visibility Validation (SP)
- **sys_id:** `02b5128223230300ab65ff5e17bf658e`
- **Environment:** UI
- **Description:** Validates whether UI Actions are visible on the current Service Portal form. Only supports Server UI Actions.
- **Gherkin:**
  ```gherkin
  Then the "<action_name>" UI action is visible in the service portal
  ```
  ```gherkin
  Then the "<action_name>" UI action is not visible in the service portal
  ```

### Add Attachments to Form (SP)
- **ATF Step:** Add Attachments to Form (SP)
- **sys_id:** `5415748677120010e46abe41a910616a`
- **Environment:** UI
- **Description:** Adds attachments to the current form in the Service Portal.
- **Gherkin:**
  ```gherkin
  When I attach files to the form in the service portal:
    | file_name   |
    | <file_name> |
  ```

---

## REST Steps

### Send REST Request - Inbound
- **ATF Step:** Send REST Request - Inbound
- **sys_id:** `e00571a10b3222000b7da95e93673a8f`
- **Environment:** Server-REST
- **Description:** Sends a REST request to the current instance. Specify HTTP method, path, query parameters, headers, and body. Cannot send to external addresses.
- **Gherkin:**
  ```gherkin
  When I send a "<method>" request to "<path>"
  ```
  ```gherkin
  When I send a "<method>" request to "<path>" with body:
    """
    <request_body>
    """
  ```
  ```gherkin
  When I send a "<method>" request to "<path>" with headers:
    | header   | value   |
    | <header> | <value> |
  ```

### Send REST Request - Inbound - REST API Explorer
- **ATF Step:** Send REST Request - Inbound - REST API Explorer
- **sys_id:** `ab3746b23b132200fc26229c93efc419`
- **Environment:** Server-REST
- **Description:** Sends a REST request using the REST API Explorer configuration. Cannot send to external addresses.
- **Gherkin:**
  ```gherkin
  When I send a REST API Explorer request to "<api_name>" "<method>" "<path>"
  ```

### Assert Status Code
- **ATF Step:** Assert Status Code
- **sys_id:** `2f4fa7309f132200ef4afa7dc67fcf0f`
- **Environment:** Server-REST
- **Description:** Asserts the HTTP response status code using a comparison operation.
- **Gherkin:**
  ```gherkin
  Then the response status code is "<code>"
  ```
  ```gherkin
  Then the response status code is not "<code>"
  ```

### Assert Status Code Name
- **ATF Step:** Assert Status Code Name
- **sys_id:** `49213f709f132200ef4afa7dc67fcfd0`
- **Environment:** Server-REST
- **Description:** Asserts the HTTP response status code name equals or contains a value.
- **Gherkin:**
  ```gherkin
  Then the response status is "<status_name>"
  ```

### Assert Response Payload
- **ATF Step:** Assert Response Payload
- **sys_id:** `d53e40d59f132200ef4afa7dc67fcfc7`
- **Environment:** Server-REST
- **Description:** Asserts the HTTP response payload equals or contains a specified value.
- **Gherkin:**
  ```gherkin
  Then the response body contains "<text>"
  ```
  ```gherkin
  Then the response body equals "<text>"
  ```

### Assert JSON Response Payload Element
- **ATF Step:** Assert JSON Response Payload Element
- **sys_id:** `afc114199f132200ef4afa7dc67fcf64`
- **Environment:** Server-REST
- **Description:** Asserts a JSON response payload element at a given JSON path.
- **Gherkin:**
  ```gherkin
  Then the response JSON path "<json_path>" equals "<value>"
  ```
  ```gherkin
  Then the response JSON path "<json_path>" contains "<value>"
  ```

### Assert Response JSON Payload Is Valid
- **ATF Step:** Assert Response JSON Payload Is Valid
- **sys_id:** `f100f7079f132200ef4afa7dc67fcf42`
- **Environment:** Server-REST
- **Description:** Asserts the JSON response payload is valid JSON.
- **Gherkin:**
  ```gherkin
  Then the response body is valid JSON
  ```

### Assert XML Response Payload Element
- **ATF Step:** Assert XML Response Payload Element
- **sys_id:** `7b403b079f132200ef4afa7dc67fcf8c`
- **Environment:** Server-REST
- **Description:** Asserts an XML response payload element at a given XPath.
- **Gherkin:**
  ```gherkin
  Then the response XML path "<xpath>" equals "<value>"
  ```
  ```gherkin
  Then the response XML path "<xpath>" contains "<value>"
  ```

### Assert Response XML Payload Is Well-Formed
- **ATF Step:** Assert Response XML Payload Is Well-Formed
- **sys_id:** `f530dcd59f132200ef4afa7dc67fcf03`
- **Environment:** Server-REST
- **Description:** Asserts the XML response payload is well-formed.
- **Gherkin:**
  ```gherkin
  Then the response body is well-formed XML
  ```

### Assert Response Header
- **ATF Step:** Assert Response Header
- **sys_id:** `ccd64c519f132200ef4afa7dc67fcf6a`
- **Environment:** Server-REST
- **Description:** Asserts an HTTP response header value.
- **Gherkin:**
  ```gherkin
  Then the response header "<header>" equals "<value>"
  ```
  ```gherkin
  Then the response header "<header>" contains "<value>"
  ```

### Assert Response Time
- **ATF Step:** Assert Response Time
- **sys_id:** `8afa37419f132200ef4afa7dc67fcf7f`
- **Environment:** Server-REST
- **Description:** Asserts the HTTP response time is less than or greater than a specified value.
- **Gherkin:**
  ```gherkin
  Then the response time is less than "<milliseconds>" ms
  ```
  ```gherkin
  Then the response time is greater than "<milliseconds>" ms
  ```

---

## Email Steps

### Validate Outbound Email
- **ATF Step:** Validate Outbound Email
- **sys_id:** `32911152c3833300eaac11fe81d3ae82`
- **Environment:** Server
- **Description:** Filters the Email [sys_email] table to find an email that was sent during testing.
- **Gherkin:**
  ```gherkin
  Then an outbound email was sent to "<recipient>" with subject "<subject>"
  ```
  ```gherkin
  Then an outbound email was sent matching:
    | field     | value     |
    | recipient | <to>      |
    | subject   | <subject> |
  ```

### Validate Outbound Email Generated by Notification
- **ATF Step:** Validate Outbound Email Generated by Notification
- **sys_id:** `a5600fa0c3033300eaac11fe81d3ae6a`
- **Environment:** Server
- **Description:** Filters the Email [sys_email] table to find an email sent from a notification during testing.
- **Gherkin:**
  ```gherkin
  Then the notification "<notification_name>" generated an email to "<recipient>"
  ```

### Validate Outbound Email Generated by Flow
- **ATF Step:** Validate Outbound Email Generated by Flow
- **sys_id:** `0d09dae4c3033300eaac11fe81d3ae1a`
- **Environment:** Server
- **Description:** Filters the Email [sys_email] table to find an email sent from a flow during testing.
- **Gherkin:**
  ```gherkin
  Then the flow "<flow_name>" generated an email to "<recipient>"
  ```

### Generate Inbound Email
- **ATF Step:** Generate Inbound Email
- **sys_id:** `e0e6f84ac3523300eaac11fe81d3ae03`
- **Environment:** Server
- **Description:** Generates an Email [sys_email] record that looks like a new inbound email. Creates an email.read event.
- **Gherkin:**
  ```gherkin
  When I receive an inbound email from "<sender>" with subject "<subject>" and body:
    """
    <email_body>
    """
  ```

### Generate Inbound Reply Email
- **ATF Step:** Generate Inbound Reply Email
- **sys_id:** `b4549a71c3623300eaac11fe81d3ae15`
- **Environment:** Server
- **Description:** Generates an Email [sys_email] record that looks like a reply to a system notification. Creates an email.read event.
- **Gherkin:**
  ```gherkin
  When I receive an inbound reply email from "<sender>" with body:
    """
    <email_body>
    """
  ```

### Generate Random String
- **ATF Step:** Generate Random String
- **sys_id:** `263313e4c3123300eaac11fe81d3aef9`
- **Environment:** Server
- **Description:** Generates a random string for test data. Default 10 characters, max 10,000.
- **Gherkin:**
  ```gherkin
  Given a random string of length "<length>"
  ```
  ```gherkin
  Given a random string
  ```

---

## Application Navigator Steps

### Navigate to Module
- **ATF Step:** Navigate to Module
- **sys_id:** `c832fc4073720300c79260bdfaf6a7a0`
- **Environment:** UI
- **Description:** Navigates to a module as if a user clicked on it. Module must be visible to the current user.
- **Gherkin:**
  ```gherkin
  When I navigate to the module "<module_name>"
  ```
  ```gherkin
  When I navigate to "<application>" > "<module_name>"
  ```

### Module Visibility
- **ATF Step:** Module Visibility
- **sys_id:** `f7cfc1973702030064a52f3c8e41f1d3`
- **Environment:** UI
- **Description:** Verifies visibility of modules in the left navigation bar.
- **Gherkin:**
  ```gherkin
  Then the module "<module_name>" is visible in the navigator
  ```
  ```gherkin
  Then the module "<module_name>" is not visible in the navigator
  ```

### Application Menu Visibility
- **ATF Step:** Application Menu Visibility
- **sys_id:** `6228cf753752030064a52f3c8e41f1a8`
- **Environment:** UI
- **Description:** Verifies visibility of application menus in the left navigation bar.
- **Gherkin:**
  ```gherkin
  Then the application menu "<menu_name>" is visible in the navigator
  ```
  ```gherkin
  Then the application menu "<menu_name>" is not visible in the navigator
  ```

---

## Custom UI Steps

### Open Service Portal Page
- **ATF Step:** Open Service Portal Page
- **sys_id:** `fc7e65d577332300e46abe41a9106106`
- **Environment:** UI
- **Description:** Opens a Service Portal page. Provide URL parameters as needed.
- **Gherkin:**
  ```gherkin
  When I open the service portal page "<page_id>"
  ```
  ```gherkin
  When I open the service portal page "<page_id>" with parameters:
    | param   | value   |
    | <param> | <value> |
  ```

### Set Component Values (Custom UI)
- **ATF Step:** Set Component Values (Custom UI)
- **sys_id:** `e5dd168473330300c79260bdfaf6a794`
- **Environment:** UI
- **Description:** Sets component values on a custom UI page.
- **Gherkin:**
  ```gherkin
  When I set the following component values:
    | component   | value   |
    | <component> | <value> |
  ```

### Component Value Validation (Custom UI)
- **ATF Step:** Component Value Validation (Custom UI)
- **sys_id:** `b4758c7453370300c792ddeeff7b128d`
- **Environment:** UI
- **Description:** Validates a component value on a custom UI page.
- **Gherkin:**
  ```gherkin
  Then the component "<component>" has value "<value>"
  ```

### Component State Validation (Custom UI)
- **ATF Step:** Component State Validation (Custom UI)
- **sys_id:** `38907e937322130007d738682bf6a742`
- **Environment:** UI
- **Description:** Validates states of components: read only, not read only.
- **Gherkin:**
  ```gherkin
  Then the component "<component>" is "<state>"
  ```
- **Notes:** Valid states: `read only`, `not read only`.

### Click Component (Custom UI)
- **ATF Step:** Click Component (Custom UI)
- **sys_id:** `def25c4b73730300c79260bdfaf6a700`
- **Environment:** UI
- **Description:** Clicks a component on a custom UI page.
- **Gherkin:**
  ```gherkin
  When I click the component "<component>"
  ```

### Assert Text on Page (Custom UI)
- **ATF Step:** Assert Text on Page (Custom UI)
- **sys_id:** `475e0de3d732130089fca2285e610361`
- **Environment:** UI
- **Description:** Asserts that specified text is or is not present on a custom UI page.
- **Gherkin:**
  ```gherkin
  Then the page contains the text "<text>"
  ```
  ```gherkin
  Then the page does not contain the text "<text>"
  ```

---

## Configurable Workspace Steps

### Open Workspace Page
- **ATF Step:** Open Workspace Page
- **sys_id:** `b74ae80243700210285ffa73cbb8f2d2`
- **Environment:** UI
- **Description:** Navigates to a workspace page using a URL, with or without the domain name.
- **Gherkin:**
  ```gherkin
  When I open the workspace page "<url>"
  ```

### Test Page
- **ATF Step:** Test Page
- **sys_id:** `33bb3cb343810210285ffa73cbb8f245`
- **Environment:** UI
- **Description:** Interacts with a seismic component on a workspace page.
- **Gherkin:**
  ```gherkin
  When I interact with the workspace component "<component_name>"
  ```

---

## Responsive Dashboards Steps

### Responsive Dashboard Visibility
- **ATF Step:** Responsive Dashboard Visibility
- **sys_id:** `60a41086b31023003e5362ff86a8dc28`
- **Environment:** Server
- **Description:** Confirms a dashboard is or is not visible to the test user.
- **Gherkin:**
  ```gherkin
  Then the dashboard "<dashboard_name>" is visible
  ```
  ```gherkin
  Then the dashboard "<dashboard_name>" is not visible
  ```

### Responsive Dashboard Sharing
- **ATF Step:** Responsive Dashboard Sharing
- **sys_id:** `d4df4ce30b13130083332dc3b6673a29`
- **Environment:** Server
- **Description:** Confirms a dashboard can or cannot be shared by the test user.
- **Gherkin:**
  ```gherkin
  Then the dashboard "<dashboard_name>" can be shared
  ```
  ```gherkin
  Then the dashboard "<dashboard_name>" cannot be shared
  ```

---

## Reporting Steps

### Report Visibility
- **ATF Step:** Report Visibility
- **sys_id:** `e6b32c570b10230083332dc3b6673a14`
- **Environment:** Server
- **Description:** Confirms a report can or cannot be viewed by the test user.
- **Gherkin:**
  ```gherkin
  Then the report "<report_name>" is visible
  ```
  ```gherkin
  Then the report "<report_name>" is not visible
  ```

---

## Virtual Agent Steps

### Start topic
- **ATF Step:** Start topic
- **sys_id:** `06ebf46229220110fa9b4ca2fb4c9dc1`
- **Environment:** Server
- **Description:** Initiates a Virtual Agent conversation for a topic given a Topic ID.
- **Gherkin:**
  ```gherkin
  When I start the virtual agent topic "<topic_id>"
  ```

### Send Message
- **ATF Step:** Send Message
- **sys_id:** `c8ef3da265220110fa9b9beedac637c5`
- **Environment:** Server
- **Description:** Sends a message to the Virtual Agent.
- **Gherkin:**
  ```gherkin
  When I send the message "<message>" to the virtual agent
  ```

### Receive Message
- **ATF Step:** Receive Message
- **sys_id:** `b55a25624d220110fa9b4c739da9ee81`
- **Environment:** Server
- **Description:** Verifies the Virtual Agent server responded with a message.
- **Gherkin:**
  ```gherkin
  Then the virtual agent responds with "<message>"
  ```
  ```gherkin
  Then the virtual agent responds with a message containing "<text>"
  ```

---

## Reusable Test Utilities Steps

### Set Output Variables
- **ATF Step:** Set Output Variables
- **sys_id:** `26302752a33012100df567d1361e61ef`
- **Environment:** Server
- **Description:** Sets the output variables for the current reusable test.
- **Gherkin:**
  ```gherkin
  When I set the output variables:
    | variable   | value   |
    | <variable> | <value> |
  ```

---

## Step Count Summary

| Category | Count |
|---|---|
| Server | 14 |
| Form | 12 |
| List and Related List | 6 |
| Service Catalog | 10 |
| Service Catalog in Service Portal | 19 |
| Service Portal | 8 |
| REST | 11 |
| Email | 6 |
| Application Navigator | 3 |
| Custom UI | 6 |
| Configurable Workspace | 2 |
| Responsive Dashboards | 2 |
| Reporting | 1 |
| Virtual Agent | 3 |
| Reusable Test Utilities | 1 |
| **Total** | **104** |

---

## Appendix: Category to sys_id Reference

| Category | sys_id |
|---|---|
| Server | `317c4dc20b202200a8d7a12cf6673aa8` |
| Form | `3c5c4dc20b202200a8d7a12cf6673a95` |
| List and Related List | `bc15fe46e72a3300b5646ea8c2f6a9bf` |
| Service Catalog | `1d786c87c3b6220076173b0ac3d3ae16` |
| Service Catalog in Service Portal | `01245d698713030070870cf888cb0bfb` |
| Service Portal | `1bd1c141e7020300b2888f49c2f6a9b0` |
| REST | `4e9228749fc72200ef4afa7dc67fcff8` |
| Custom UI | `581a597353d21300ac15ddeeff7b12a6` |
| Email | `876bc893c3033300eaac11fe81d3ae6b` |
| Application Navigator | `92af89573702030064a52f3c8e41f1aa` |
| Configurable Workspace | `01d93c3343810210285ffa73cbb8f27f` |
| Responsive Dashboards | `ac3c433ab31023003e5362ff86a8dcb1` |
| Reporting | `fff36c570b10230083332dc3b6673a84` |
| Virtual Agent | `ba6f342185624110fa9b9ec3591441e7` |
| Reusable Test Utilities | `843222a5ff48a6100df5ffffffffff89` |
