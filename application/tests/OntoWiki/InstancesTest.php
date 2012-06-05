<?php

require_once '../test_base.php';

// PHPUnit
#require_once 'PHPUnit/Framework.php';
require_once '../../../libraries/Erfurt/tests/Erfurt/TestCase.php';

/**
 * InstancesTest tests the behavior of Ontowiki_Model_Instances
 *
 * @author Jonas Brekle <jonas.brekle@gmail.com>
 */
class InstancesTest extends Erfurt_TestCase {

    protected $instances;

    protected $_store;

    public function setUp(){
        $this->markTestNeedsDatabase();
        $this->_store = Erfurt_App::getInstance()->getStore();
        //$c = Erfurt_App::getInstance()->getConfig();
        //$c->titleHelper->properties = array();
        $this->instances = new OntoWiki_Model_Instances($this->_store, new Erfurt_Rdf_Model('http://graph.com')); // no config given
    }

    public function testQuery(){
        echo $this->instances->getResourceQuery();
    }
    
    public function testSerialization(){
        ob_start();
        $this->instances = unserialize(serialize($this->instances));
        $v = $this->instances->getValues();
        $o = ob_get_contents();
        ob_end_clean();
        $this->assertTrue(empty($o)); //no warnings
    }
}
?>
