<?php
// vim: sw=4:sts=4:expandtab

if (!defined("EOL")) {
    define("EOL","\n");
}

require_once 'OntoWiki/Component/Helper.php';

/**
 * Helper class for the FOAF Editor component.
 * Checks whether the current resource is an instance of foaf:Person
 * and registers the FOAF Editor component if so.
 *
 * @category   OntoWiki
 * @package    OntoWiki_extensions_components_map
 * @author Norman Heino <norman.heino@gmail.com>
 * @version $Id: FoafeditHelper.php 3053 2009-05-08 12:15:51Z norman.heino $
 */
class MapHelper extends OntoWiki_Component_Helper
{

    private $instances = null;

    public function init()
    {
        $onSwitch = false;  // decide, if map should be on

        if (isset($this->_privateConfig->switch->on) AND $this->_privateConfig->switch->on == 'ever') {
            $onSwitch = true;
        }

        if (!$onSwitch) {
            $onSwitch = $this->shouldShow();
        }

        if ($onSwitch) {
            // register new tab
            require_once 'OntoWiki/Navigation.php';

            if (!OntoWiki_Navigation::isRegistered('map')) {
                OntoWiki_Navigation::register('map', array(
                            'controller' => 'map', 
                            'action'     => 'display', 
                            'name'       => 'Map', 
                            'priority'   => 20,
                            'active'     => false));
            }
        }
    }

    public function shouldShow () 
    {

        $owApp = OntoWiki::getInstance();
        $session = $owApp->session;

        if (isset($session->instances)) {

            $latProperties  = $this->_privateConfig->property->latitude->toArray();
            $longProperties = $this->_privateConfig->property->longitude->toArray();
            $latProperty    = $latProperties[0];
            $longProperty   = $longProperties[0];

            $latVar         = new Erfurt_Sparql_Query2_Var('lat');
            $longVar        = new Erfurt_Sparql_Query2_Var('long');
            $lat2Var        = new Erfurt_Sparql_Query2_Var('lat2');
            $long2Var       = new Erfurt_Sparql_Query2_Var('long2');

            //the future is now!
            if($this->instances === null) {    
                $this->instances = clone $session->instances;
                $owApp->logger->debug('MapHelper/shouldShow: clone this->_session->instances');
            } else {
                $owApp->logger->debug('MapHelper/shouldShow: this->instances already set');
                // don't load instances again
            }

            $query          = $this->instances->getResourceQuery();
            $owApp->logger->debug('MapHelper/shouldShow: session query: ' . var_export((string)$query, true));

            $query->setQueryType(Erfurt_Sparql_Query2::typeSelect); /* would like to ask but ask lies */
            $this->instances->setLimit(1);
            $this->instances->setOffset(0);

            $query->removeAllOptionals()->removeAllProjectionVars();

            $query->addProjectionVar($this->instances->getResourceVar());
            $query->addProjectionVar($latVar);
            $query->addProjectionVar($longVar);
            $query->addProjectionVar($lat2Var);
            $query->addProjectionVar($long2Var);

            $queryEu     = new Erfurt_Sparql_Query2_GroupGraphPattern();
            $queryUsa     = new Erfurt_Sparql_Query2_GroupGraphPattern();

            $node = new Erfurt_Sparql_Query2_Var('node'); // should be $node = new Erfurt_Sparql_Query2_BlankNode('bn'); but i heard this is not supported yet by zendb
            $queryEu->addTriple($this->instances->getResourceVar(), $latProperty, $latVar);
            $queryEu->addTriple($this->instances->getResourceVar(), $longProperty, $longVar);
            $queryUsa->addTriple($this->instances->getResourceVar(), new Erfurt_Sparql_Query2_Var('pred') , $node);
            $queryUsa->addTriple($node, $latProperty, $lat2Var);
            $queryUsa->addTriple($node, $longProperty, $long2Var);

            $queryUno     = new Erfurt_Sparql_Query2_GroupOrUnionGraphPattern();

            $queryUno->addElement($queryEu)->addElement($queryUsa);
            $query->addElement($queryUno);
            $owApp->logger->debug('MapHelper/shouldShow: sent "' . $query . '" to know if SpacialThings are available.');

            /* get result of the query */
            $result    = $this->_owApp->erfurt->getStore()->sparqlQuery($query);

            $owApp->logger->debug('MapHelper/shouldShow: got respons "' . var_export($result, true) . '".');

            if ($result) {
                $result = true;
            } else {
                $result = false;
            }

            return $result;
        } else {
            $owApp->logger->debug('MapHelper/shouldShow: no instances object set in session → no instances to show → no map.');

            return false;

            /* old code */

            if($owApp->selectedModel) {

                require_once 'Erfurt/Sparql/SimpleQuery.php';

                $store    = $owApp->erfurt->getStore();
                $resource = (string) $owApp->selectedResource;

                // build the query to get all marker resources
                $query = new Erfurt_Sparql_SimpleQuery( );

                $query->setProloguePart( 'SELECT ?p' );

                $where = "WHERE {"      . EOL;
                $where.= "	?s ?p ?o."  . EOL;
                $where.= "	FILTER("    . EOL;

                $latitude	= $this->_privateConfig->property->latitude->toArray();
                $longitude	= $this->_privateConfig->property->longitude->toArray();

                for ($i = 0; $i < count($latitude); $i++) {
                    $lat = $latitude[$i];
                    $long = $longitude[$i];
                    if( $i != 0 ) {
                        $where.= " || ";
                    }
                    $where.= "		sameTerm(?p, <" . $lat . ">) ||" . EOL;
                    $where.= "		sameTerm(?p, <" . $long . ">)"   . EOL;
                }

                $where.= ") }";

                $query->setWherePart($where);
                $query->setLimit(1);
                // ask for the properties
                return $owApp->selectedModel->sparqlQuery($query);
            } else {
                return false;
            }
        }
    }
}

