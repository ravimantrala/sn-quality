@Priority @AutoClassification @IncidentManagement
Feature: Incident Auto-Priority Assignment Based on Impact and Urgency
  As an ITIL process owner
  I want incidents to automatically calculate priority from impact and urgency
  So that SLAs and response times are consistently applied

  Background:
    Given I am logged in as an ITIL user

  # -------------------------------------------------------------------
  # Full 3x3 Priority Matrix Validation
  # -------------------------------------------------------------------
  @Matrix @Smoke
  Scenario: High Impact + High Urgency = Critical Priority (P1)
    When I insert a record into "incident" with:
      | field             | value                                   |
      | caller_id         | Abel Tuter                              |
      | short_description | Priority matrix — impact 1, urgency 1   |
      | impact            | 1 - High                                |
      | urgency           | 1 - High                                |
      | category          | Software                                |
      | assignment_group  | Service Desk                            |
    Then the "incident" record has:
      | field    | operator | value |
      | priority | =        | 1     |

  Scenario: High Impact + Medium Urgency = High Priority (P2)
    When I insert a record into "incident" with:
      | field             | value                                   |
      | caller_id         | Abel Tuter                              |
      | short_description | Priority matrix — impact 1, urgency 2   |
      | impact            | 1 - High                                |
      | urgency           | 2 - Medium                              |
      | category          | Software                                |
      | assignment_group  | Service Desk                            |
    Then the "incident" record has:
      | field    | operator | value |
      | priority | =        | 2     |

  Scenario: High Impact + Low Urgency = Moderate Priority (P3)
    When I insert a record into "incident" with:
      | field             | value                                   |
      | caller_id         | Abel Tuter                              |
      | short_description | Priority matrix — impact 1, urgency 3   |
      | impact            | 1 - High                                |
      | urgency           | 3 - Low                                 |
      | category          | Software                                |
      | assignment_group  | Service Desk                            |
    Then the "incident" record has:
      | field    | operator | value |
      | priority | =        | 3     |

  Scenario: Medium Impact + High Urgency = High Priority (P2)
    When I insert a record into "incident" with:
      | field             | value                                   |
      | caller_id         | Abel Tuter                              |
      | short_description | Priority matrix — impact 2, urgency 1   |
      | impact            | 2 - Medium                              |
      | urgency           | 1 - High                                |
      | category          | Software                                |
      | assignment_group  | Service Desk                            |
    Then the "incident" record has:
      | field    | operator | value |
      | priority | =        | 2     |

  Scenario: Medium Impact + Medium Urgency = Moderate Priority (P3)
    When I insert a record into "incident" with:
      | field             | value                                   |
      | caller_id         | Abel Tuter                              |
      | short_description | Priority matrix — impact 2, urgency 2   |
      | impact            | 2 - Medium                              |
      | urgency           | 2 - Medium                              |
      | category          | Software                                |
      | assignment_group  | Service Desk                            |
    Then the "incident" record has:
      | field    | operator | value |
      | priority | =        | 3     |

  Scenario: Medium Impact + Low Urgency = Low Priority (P4)
    When I insert a record into "incident" with:
      | field             | value                                   |
      | caller_id         | Abel Tuter                              |
      | short_description | Priority matrix — impact 2, urgency 3   |
      | impact            | 2 - Medium                              |
      | urgency           | 3 - Low                                 |
      | category          | Software                                |
      | assignment_group  | Service Desk                            |
    Then the "incident" record has:
      | field    | operator | value |
      | priority | =        | 4     |

  Scenario: Low Impact + High Urgency = Moderate Priority (P3)
    When I insert a record into "incident" with:
      | field             | value                                   |
      | caller_id         | Abel Tuter                              |
      | short_description | Priority matrix — impact 3, urgency 1   |
      | impact            | 3 - Low                                 |
      | urgency           | 1 - High                                |
      | category          | Software                                |
      | assignment_group  | Service Desk                            |
    Then the "incident" record has:
      | field    | operator | value |
      | priority | =        | 3     |

  Scenario: Low Impact + Medium Urgency = Low Priority (P4)
    When I insert a record into "incident" with:
      | field             | value                                   |
      | caller_id         | Abel Tuter                              |
      | short_description | Priority matrix — impact 3, urgency 2   |
      | impact            | 3 - Low                                 |
      | urgency           | 2 - Medium                              |
      | category          | Software                                |
      | assignment_group  | Service Desk                            |
    Then the "incident" record has:
      | field    | operator | value |
      | priority | =        | 4     |

  Scenario: Low Impact + Low Urgency = Planning Priority (P5)
    When I insert a record into "incident" with:
      | field             | value                                   |
      | caller_id         | Abel Tuter                              |
      | short_description | Priority matrix — impact 3, urgency 3   |
      | impact            | 3 - Low                                 |
      | urgency           | 3 - Low                                 |
      | category          | Software                                |
      | assignment_group  | Service Desk                            |
    Then the "incident" record has:
      | field    | operator | value |
      | priority | =        | 5     |
