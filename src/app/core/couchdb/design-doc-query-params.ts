export interface DesignDocQueryParams {
  /** Includes conflicts information in response. Ignored if include_docs isn’t true. Default is false. */
  conflicts?: boolean;
  /** Return the design documents in descending by key order. Default is false. */
  descending?: boolean;
  /** Stop returning records when the specified key is reached. Optional. */
  endkey?: string;
  /** Alias for endkey param. */
  end_key?: string;
  /** Stop returning records when the specified design document ID is reached. Optional. */
  endkey_docid?: string;
  /** Alias for endkey_docid param. */
  end_key_doc_id?: string;
  /** Include the full content of the design documents in the return. Default is false. */
  include_docs?: boolean;
  /** Specifies whether the specified end key should be included in the result. Default is true. */
  inclusive_end?: boolean;
  /** Return only design documents that match the specified key. Optional. */
  key?: string;
  /** Return only design documents that match the specified keys. Optional. */
  keys?: string;
  /** Limit the number of the returned design documents to the specified number. Optional. */
  limit?: number;
  /** Skip this number of records before starting to return the results. Default is 0. */
  skip?: number;
  /** Return records starting with the specified key. Optional. */
  startkey?: string;
  /** Alias for startkey param. */
  start_key?: string;
  /** Return records starting with the specified design document ID. Optional. */
  startkey_docid?: string;
  /** Alias for startkey_docid param. */
  start_key_doc_id?: string;
  /** Response includes an update_seq value indicating which sequence id of the underlying database the view reflects. Default is false. */
  update_seq?: boolean;
}
