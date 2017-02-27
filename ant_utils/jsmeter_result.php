<?php
class Complexity {
	const ERROR_VALUE   = 10;
	const WARNING_VALUE = 6;

	var $max = 0;

	function rating($value) {
		$result = "";
		if ($this->isWarning($value)) {
			$result = "*";
		}
		$this->captureMax($value);
		return $result;
	}

	function isError($value) {
		return self::ERROR_VALUE <= $value;
	}

	function isWarning($value) {
		return self::WARNING_VALUE <= $value;
	}

	function captureMax($value) {
		if ($this->max < $value) {
			$this->max = $value;
		}
	}

	function verify() {
		if ($this->isError($this->max)) {
			$mesg = sprintf("max complexity = %d, grater equal %d\n", $this->max, self::ERROR_VALUE);
			echo $mesg;
			exit(1);
		}
	}
}

class Lines {
	const ERROR_VALUE   = 100;
	const WARNING_VALUE = 30;

	var $max = 0;

	function rating($value, $i) {
		$result = "";
		if (0 < $i && $this->isWarning($value)) {
			$result = "*";
		}
		$this->captureMax($value, $i);
		return $result;
	}

	function isError($value) {
		return self::ERROR_VALUE <= $value;
	}

	function isWarning($value) {
		return self::WARNING_VALUE <= $value;
	}

	function captureMax($value, $i) {
		if (0 < $i) {
			if ($this->max < $value) {
				$this->max = $value;
			}
		}
	}

	function verify() {
		if ($this->isError($this->max)) {
			$mesg = sprintf("max lines = %d, grater equal %d\n", $this->max, self::ERROR_VALUE);
			echo $mesg;
			exit(1);
		}
	}
}

class JsmeterResult {
	var $complexity;
	var $lines;

	function analyze($path) {
		$this->complexity = new Complexity();
		$this->lines      = new Lines();

		echo "\n";
		echo $path . "\n";

		$data = file_get_contents($path);
		$jsonObj = json_decode($data);

		array_walk($jsonObj, array($this, "analyzeOne"));
	}

	function analyzeOne($item, $i) {
		$complecityRating = $this->complexity->rating($item->complexity);
		$linesRating      = $this->lines->rating($item->lines, $i);

		$mesg =$this->buildMessage($item, $complecityRating, $linesRating);
		echo $mesg;
	}

	function buildMessage($item, $complecityRating, $linesRating) {
		$mesg = sprintf(
			"complexity: %d%s\tshortName: %-30s\tline: %d-%d\tlines: %d%s\n",
			$item->complexity,
			$complecityRating,
			$item->shortName,
			$item->lineStart,
			$item->lineEnd,
			$item->lines,
			$linesRating
		);
		return $mesg;
	}

	function verify() {
		$this->complexity->verify();
//		$this->lines->verify();
	}
}

$app = new JsmeterResult();
$app->analyze($argv[1]);
$app->verify();
