<?php
/**
 * Map Advanced field class.
 */
class RWMB_Map_Advanced_Field extends RWMB_Map_Field
{
	/**
	 * Enqueue scripts and styles
	 *
	 * @return void
	 */
	static function admin_enqueue_scripts()
	{
		/**
		 * Allows developers load more libraries via a filter.
		 * @link https://developers.google.com/maps/documentation/javascript/libraries
		 */
		$google_maps_url = apply_filters( 'rwmb_google_maps_url', 'https://maps.google.com/maps/api/js' );
		wp_register_script( 'google-maps', esc_url_raw( $google_maps_url ), array(), '', true );
		wp_enqueue_style( 'rwmb-map', RWMB_CSS_URL . 'map.css' );
		wp_enqueue_script( 'rwmb-map-advanced', RWMB_JS_URL . 'map-advanced.js', array( 'jquery-ui-autocomplete', 'google-maps' ), RWMB_VER, true );
	}

	/**
	 * Get field HTML
	 *
	 * @param mixed $meta
	 * @param array $field
	 *
	 * @return string
	 */
	static function html( $meta, $field )
	{
		$html = '<div class="rwmb-map-advanced-field">';
		foreach( array( 'latitude', 'longitude', 'zoom' ) as $part )
		{
			$html .= sprintf(
				'<input type="hidden" name="%s" class="rwmb-map-%s" value="%s">',
				$field['field_name'] . "[{$part}]",
				$part,
				$meta[ $part ]
			);
		}

		$html .= sprintf(
			'<div class="rwmb-map-canvas" data-default-loc="%s"></div>',
			esc_attr( $field['std'] )
		);

		if ( $field['address'] )
		{
			$html .= sprintf(
				'<input type="text" class="rwmb-map-address" size="30" name="%s" value="%s">
				<button class="button rwmb-map-goto-address-button" >%s</button>',
				$field['field_name'] . "[address]",
				isset( $meta['address'] ) ? $meta['address'] : '',
				__( 'Find Address', 'meta-box' )
			);
		}

		$html .= '</div>';

		return $html;
	}

	/**
	 * Get meta value
	 *
	 * @param int   $post_id
	 * @param bool  $saved
	 * @param array $field
	 *
	 * @return mixed
	 */
	static function meta( $post_id, $saved, $field )
	{
		$meta = parent::meta( $post_id, $saved, $field );

		if( $field['clone'] )
		{
			foreach( $meta as $key => $value )
			{
				if( is_string( $value ) )
				{
					$meta[ $key ] = array_combine( array( 'latitude', 'longitude', 'zoom' ), array_slice( explode( ',', $value . ',,' ), 0, 3 ) );
				}

				$meta[ $key ] = wp_parse_args( $meta[ $key ], array(
					'zoom' => 14
				) );
			}

			return $meta;
		}

		if( is_string( $meta ) )
		{
			$meta = array_combine( array( 'latitude', 'longitude', 'zoom' ), array_slice( explode( ',', $meta . ',,' ), 0, 3 ) );
		}

		$meta = wp_parse_args( $meta, array(
			'zoom' => 14
		) );

		return $meta;
	}

	/**
	 * Normalize parameters for field
	 *
	 * @param array $field
	 *
	 * @return array
	 */
	static function normalize( $field )
	{
		$field = parent::normalize( $field );
		$field = wp_parse_args( $field, array(
			'std'           => '',
			'address'       => false,
		) );

		return $field;
	}

	/**
	 * Get the field value
	 * The difference between this function and 'meta' function is 'meta' function always returns the escaped value
	 * of the field saved in the database, while this function returns more meaningful value of the field
	 *
	 * @param  array    $field   Field parameters
	 * @param  array    $args    Not used for this field
	 * @param  int|null $post_id Post ID. null for current post. Optional.
	 *
	 * @return mixed Array(latitude, longitude, zoom)
	 */
	static function get_value( $field, $args = array(), $post_id = null )
	{
		$value = parent::get_value( $field, $args, $post_id );
		if( is_string( $value ) )
		{
			$value = array_combine( array( 'latitude', 'longitude', 'zoom' ), array_slice( explode( ',', $value . ',,' ), 0, 3 ) );
		}

		return $value;
	}
}
