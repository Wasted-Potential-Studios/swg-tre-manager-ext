/**
 * Copyright (c) 2024-2026 Wasted Potential Studios LLC
 * Licensed under the MIT License
 *
 * Constants for TRE file format
 */

/**
 * TRE file format constants
 */
export const TRE_CONSTANTS = {
    /** Magic number "TREE" */
    MAGIC_TOKEN: 0x54524545,

    /** Version 0004 tag */
    VERSION_0004: 0x30303034,

    /** Version 0005 tag */
    VERSION_0005: 0x30303035,

    /** Header size in bytes */
    HEADER_SIZE: 36,

    /** TOC entry size in bytes */
    TOC_ENTRY_SIZE: 24,

    /** MD5 hash size in bytes */
    MD5_SIZE: 16,

    /** No compression */
    COMPRESSION_NONE: 0,

    /** Zlib compression */
    COMPRESSION_ZLIB: 2,

    /** Buffer size for streaming operations */
    BUFFER_SIZE: 64 * 1024, // 64KB

    /** Maximum file size to load into memory (100MB) */
    MAX_MEMORY_SIZE: 100 * 1024 * 1024,
} as const;

/**
 * Default build options
 */
export const DEFAULT_BUILD_OPTIONS = {
    version: '0005' as const,
    compressToc: true,
    compressFiles: true,
};

/**
 * Default extraction options
 */
export const DEFAULT_EXTRACTION_OPTIONS = {
    preserveStructure: true,
    overwrite: false,
};

/**
 * File extensions to recognize
 */
export const KNOWN_EXTENSIONS = {
    IFF: '.iff',
    TAB: '.tab',
    STF: '.stf',
    TRN: '.trn',
    MSH: '.msh',
    MGN: '.mgn',
    DDS: '.dds',
    TGA: '.tga',
    SHT: '.sht',
    LUA: '.lua',
    INC: '.inc',
    DST: '.dst',
} as const;

/**
 * Wasted Potential Studios color palette
 */
export const WPS_COLORS = {
    // Primary colors
    primaryPurple: '#9b59b6',
    darkPurple: '#8e44ad',
    deepPurple: '#7d3c98',

    // Accent colors
    successGreen: '#2ecc71',
    darkGreen: '#27ae60',
    errorRed: '#e74c3c',
    darkRed: '#c0392b',
    infoBlue: '#3498db',
    darkBlue: '#2980b9',

    // Background colors
    deepestBlack: '#0a0a0a',
    darkGray: '#1a1a1a',
    mediumGray: '#2a2a2a',
    lightGray: '#3a3a3a',
    borderGray: '#4a4a4a',

    // Text colors
    white: '#e0e0e0',
    lightText: '#b0b0b0',
    mediumText: '#888888',
    darkText: '#666666',
} as const;

/**
 * Extension IDs for integration
 */
export const EXTENSION_IDS = {
    IFF_EDITOR: 'WastedPotentialStudios.swg-iff-editor',
    DATATABLE_EDITOR: 'WastedPotentialStudios.swg-datatable-editor',
    STF_EDITOR: 'WastedPotentialStudios.swg-stf-editor',
} as const;

/**
 * Tree item context values
 */
export const TREE_ITEM_CONTEXT = {
    CATEGORY: 'treCategory',
    ARCHIVE: 'treArchive',
    FOLDER: 'treFolder',
    FILE: 'treFile',
} as const;

/**
 * Category names for archive organization
 */
export const ARCHIVE_CATEGORIES = {
    CLIENT_DATA: 'Official Client Data',
    PATCHES: 'Official Patches',
    CUSTOM_CONTENT: 'Custom Content',
    SERVER_FILES: 'Server Files',
} as const;
