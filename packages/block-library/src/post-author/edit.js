/**
 * External dependencies
 */
import classnames from 'classnames';
/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useRef, useState } from '@wordpress/element';
import { useEntityProp } from '@wordpress/core-data';
import {
	AlignmentToolbar,
	BlockControls,
	InspectorControls,
	RichText,
	__experimentalUseColors,
	withFontSizes,
	__experimentalLinkControl as LinkControl,
} from '@wordpress/block-editor';
import {
	KeyboardShortcuts,
	Notice,
	PanelBody,
	Popover,
	SelectControl,
	ToggleControl,
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components';
import {
	rawShortcut,
	displayShortcut,
} from '@wordpress/keycodes';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockColorsStyleSelector from './block-colors-selector';

const DEFAULT_AVATAR_SIZE = 24;

function PostAuthorDisplay( { props, author, authors } ) {
	const ref = useRef();

	const { editPost } = useDispatch( 'core/editor' );
	const [ isLinkOpen, setIsLinkOpen ] = useState( false );

	const { fontSize } = props;

	const {
		TextColor,
		BackgroundColor,
		InspectorControlsColorPanel,
		ColorPanel,
	} = __experimentalUseColors(
		[
			{ name: 'textColor', property: 'color' },
			{ name: 'backgroundColor', className: 'background-color' },
		],
		{
			contrastCheckers: [ { backgroundColor: true, textColor: true, fontSize: fontSize.size } ],
			colorDetector: { targetRef: ref },
			colorPanelProps: {
				initialOpen: true,
			},
		},
		[ fontSize.size ]
	);

	const { id, firstName, lastName, name, showAvatar, showDisplayName } = props.attributes;

	const hasFirstOrLastNameSet = !! firstName || !! lastName;
	const avatarSizes = [
		{ value: 24, label: __( 'Small' ) },
		{ value: 48, label: __( 'Medium' ) },
		{ value: 96, label: __( 'Large' ) },
	];

	const changeAuthor = ( authorId ) => {
		apiFetch( { path: '/wp/v2/users/' + authorId + '?context=edit' } ).then( ( newAuthor ) => {
			editPost( { author: Number( authorId ) } );
			props.setAttributes( {
				id: newAuthor.id,
				name: newAuthor.name,
				firstName: newAuthor.firstName,
				lastName: newAuthor.lastName,
				avatarSize: props.attributes.avatarSize,
				avatarUrl: newAuthor.avatar_urls[ props.attributes.avatarSize ],
			} );
		} );
	};

	const authorName = showDisplayName && hasFirstOrLastNameSet ?
		[ firstName, lastName ].join( ' ' ) :
		name;
	props.setAttributes( {
		postAuthorName: authorName,
	} );

	const blockClassNames = classnames( 'wp-block-post-author', {
		[ fontSize.class ]: fontSize.class,
	} );
	const blockInlineStyles = {
		fontSize: fontSize.size ? fontSize.size + 'px' : undefined,
	};

	return (
		<>
			<BlockControls>
				<AlignmentToolbar />
				<BlockColorsStyleSelector
					TextColor={ TextColor }
					BackgroundColor={ BackgroundColor }
				>

					{ ColorPanel }

				</BlockColorsStyleSelector>
				<ToolbarGroup>
					<KeyboardShortcuts
						bindGlobal
						shortcuts={ {
							[ rawShortcut.primary( 'k' ) ]: () => setIsLinkOpen( true ),
						} }
					/>
					<ToolbarButton
						name="link"
						icon="admin-links"
						title={ __( 'Link' ) }
						shortcut={ displayShortcut.primary( 'k' ) }
						onClick={ () => setIsLinkOpen( ! isLinkOpen ) }
					/>
				</ToolbarGroup>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Author Settings' ) }>
					<SelectControl
						label={ __( 'Author' ) }
						value={ id }
						options={ authors.map( ( theAuthor ) => {
							return {
								value: theAuthor.id,
								label: theAuthor.name,
							};
						} ) }
						onChange={ ( authorID ) => {
							changeAuthor( authorID );
						} }
					/>
					<ToggleControl
						label={ __( 'Show avatar' ) }
						checked={ showAvatar }
						onChange={ () => props.setAttributes( { showAvatar: ! showAvatar } ) }
					/>
					<ToggleControl
						label={ __( 'Show display name' ) }
						checked={ showDisplayName }
						onChange={ () => props.setAttributes( { showDisplayName: ! showDisplayName } ) }
					/>
					{ showDisplayName && ! hasFirstOrLastNameSet &&
						<Notice status="warning" isDismissible={ false }>
							{ __( 'This author does not have their name set' ) }
						</Notice>
					}
					<hr />
					<SelectControl
						label={ __( 'Avatar size' ) }
						value={ props.attributes.avatarSize }
						options={ avatarSizes }
						onChange={ ( size ) => {
							props.setAttributes( {
								avatarSize: size,
								avatarUrl: author.avatar_urls[ size ],
							} );
						} }
					/>
				</PanelBody>
			</InspectorControls>

			{ InspectorControlsColorPanel }

			<TextColor>
				<BackgroundColor>
					<div
						ref={ ref }
						className={ blockClassNames }
						style={ blockInlineStyles }
					>
						{ showAvatar &&
							<img
								width={ props.attributes.avatarSize }
								src={ props.attributes.avatarUrl }
								alt={ props.attributes.postAuthorName }
								className="wp-block-post-author__avatar"
							/>
						}
						<RichText
							className="wp-block-post-author__name"
							multiline={ false }
							withoutInteractiveFormatting
							allowedFormats={ [
								'core/bold',
								'core/italic',
								'core/strikethrough',
							] }
							value={ props.attributes.postAuthorName }
							onChange={ () => {
								setIsLinkOpen( true );
							} }
						/>
						{ isLinkOpen && (
							<Popover position="bottom center">
								<LinkControl
									className="wp-block-navigation-link__inline-link-input"
									value={ '' }
									showInitialSuggestions={ true }
									onChange={ ( link ) => props.setAttributes( { link } ) }
									onClose={ () => setIsLinkOpen( false ) }
								/>
							</Popover>
						) }
					</div>
				</BackgroundColor>
			</TextColor>
		</>
	);
}

function PostAuthorEdit( props ) {
	let [ authorId ] = useEntityProp( 'postType', 'post', 'author' );

	if ( !! props.attributes.id ) {
		authorId = props.attributes.id;
	}

	const { author, authors } = useSelect( ( select ) => {
		const {
			getEntityRecord,
			getAuthors,
		} = select( 'core' );
		return {
			author: getEntityRecord( 'root', 'user', authorId ),
			authors: getAuthors(),
		};
	}, [ authorId ] );

	if ( ! author ) {
		return 'Post Author Placeholder';
	}

	const { setAttributes } = props;

	let avatarSize = DEFAULT_AVATAR_SIZE;
	if ( !! props.attributes.avatarSize ) {
		avatarSize = props.attributes.avatarSize;
	}
	setAttributes( {
		id: Number( author.id ),
		name: author.name,
		firstName: author.first_name,
		lastName: author.last_name,
		avatarSize,
		avatarUrl: author.avatar_urls[ avatarSize ],
	} );

	return <PostAuthorDisplay props={ props } author={ author } authors={ authors } />;
}

export default withFontSizes( 'fontSize' )( PostAuthorEdit );
